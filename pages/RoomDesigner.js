import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Stage, Layer, Line, Circle, Shape, Rect } from "react-konva";
import { useRouter } from 'next/router';

const DynamicStage = dynamic(() => import("react-konva").then((mod) => mod.Stage), { ssr: false });
const DynamicLayer = dynamic(() => import("react-konva").then((mod) => mod.Layer), { ssr: false });

const RoomDesigner = () => {
  const router = useRouter();
  const [room, setRoom] = useState(null);
  const [desks, setDesks] = useState([]);
  const [gridSize, setGridSize] = useState(20);
  const [stageWidth, setStageWidth] = useState(800);
  const [stageHeight, setStageHeight] = useState(600);
  const [isAddingDesk, setIsAddingDesk] = useState(false);
  const [currentDesk, setCurrentDesk] = useState([]);
  const [selectedDesk, setSelectedDesk] = useState(null);
  const [deskColors, setDeskColors] = useState({});
  const [nextDeskId, setNextDeskId] = useState(0);
  const [gridOpacity, setGridOpacity] = useState(0.5);
  const [roomOpacity, setRoomOpacity] = useState(0.3);
  const [deskOpacity, setDeskOpacity] = useState(0.5);
  const [isDraggingDesk, setIsDraggingDesk] = useState(false);
  const [deskOffset, setDeskOffset] = useState({ x: 0, y: 0 });
  const [tempDeskPosition, setTempDeskPosition] = useState(null);
  const stageRef = useRef(null);

  useEffect(() => {
    const storedFloorPlan = sessionStorage.getItem("FloorPlan");
    const storedRoom = sessionStorage.getItem("SelectedRoom");
    const storedDesks = sessionStorage.getItem("RoomDesks");
    const allDesks = JSON.parse(sessionStorage.getItem("Desks") || "[]");
    const gridSize = sessionStorage.getItem("GridSize");
    const stageWidth = sessionStorage.getItem("GridWidth");
    const stageHeight = sessionStorage.getItem("GridHeight");
    
    if (storedFloorPlan) {
      const floorPlan = JSON.parse(storedFloorPlan);
      setGridSize(floorPlan.gridSize);
      setStageWidth(floorPlan.width);
      setStageHeight(floorPlan.height);
    }

    if (storedRoom) {
      const parsedRoom = JSON.parse(storedRoom);
      setRoom(parsedRoom);
    }

    if (storedDesks) {
      const parsedDesks = JSON.parse(storedDesks);
      setDesks(parsedDesks);
      const newDeskColors = {};
      parsedDesks.forEach((desk) => {
        newDeskColors[desk.id] = getRandomColor();
      });
      setDeskColors(newDeskColors);
    }

    // Calculate the next available desk ID
    const maxDeskId = Math.max(
      ...allDesks.map(desk => desk.id),
      ...desks.map(desk => desk.id),
      0
    );
    setNextDeskId(maxDeskId + 1);

    if (gridSize) {
      setGridSize(parseInt(gridSize));
    }

    if (stageWidth) {
      setStageWidth(parseInt(stageWidth));
    }

    if (stageHeight) {  
      setStageHeight(parseInt(stageHeight));
    }
  }, []);

  const snapToGrid = (value) => Math.round(value / gridSize) * gridSize;

  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const handleStageClick = (e) => {
    const stage = e.target.getStage();
    const mousePos = stage.getPointerPosition();
    const clickedPosition = {
      x: snapToGrid(mousePos.x),
      y: snapToGrid(mousePos.y),
    };

    if (isAddingDesk) {
      setCurrentDesk((prevDesk) => {
        const existingSquare = prevDesk.find(
          (square) =>
            square.x === clickedPosition.x && square.y === clickedPosition.y
        );
        if (existingSquare) {
          return prevDesk.filter(
            (square) =>
              square.x !== clickedPosition.x || square.y !== clickedPosition.y
          );
        } else {
          return [...prevDesk, clickedPosition];
        }
      });
    } else {
      const clickedDesk = desks.find((desk) =>
        isPointInPolygon(clickedPosition, desk.vertices)
      );
      setSelectedDesk(clickedDesk || null);
    }
  };

  const toggleAddDesk = () => {
    setIsAddingDesk(!isAddingDesk);
    if (isAddingDesk) {
      if (currentDesk.length > 0) {
        const vertices = squaresToVertices(currentDesk);
        const newDesk = {
          id: nextDeskId,
          roomId: room.id,
          vertices: vertices,
        };
        setDesks((prevDesks) => [...prevDesks, newDesk]);
        setDeskColors((prevColors) => ({
          ...prevColors,
          [nextDeskId]: getRandomColor(),
        }));
        setNextDeskId((prevId) => prevId + 1);
        setCurrentDesk([]);
      }
    } else {
      setCurrentDesk([]);
    }
  };

  const squaresToVertices = (squares) => {
    const minX = Math.min(...squares.map((s) => s.x));
    const minY = Math.min(...squares.map((s) => s.y));
    const maxX = Math.max(...squares.map((s) => s.x)) + gridSize;
    const maxY = Math.max(...squares.map((s) => s.y)) + gridSize;

    const edges = new Set();
    squares.forEach((square) => {
      edges.add(`${square.x},${square.y}`);
      edges.add(`${square.x + gridSize},${square.y}`);
      edges.add(`${square.x},${square.y + gridSize}`);
      edges.add(`${square.x + gridSize},${square.y + gridSize}`);
    });

    const vertices = [];
    let x = minX, y = minY;
    let direction = 0; // 0: right, 1: down, 2: left, 3: up

    do {
      if (edges.has(`${x},${y}`)) {
        vertices.push({ x, y });
        direction = (direction + 3) % 4;
      } else {
        direction = (direction + 1) % 4;
      }

      switch (direction) {
        case 0: x += gridSize; break;
        case 1: y += gridSize; break;
        case 2: x -= gridSize; break;
        case 3: y -= gridSize; break;
      }
    } while (!(x === minX && y === minY));

    return vertices;
  };

  const deleteSelectedDesk = () => {
    if (selectedDesk) {
      setDesks((prevDesks) => prevDesks.filter((desk) => desk.id !== selectedDesk.id));
      
      // Update the global Desks list in session storage
      const allDesks = JSON.parse(sessionStorage.getItem("Desks") || "[]");
      const updatedAllDesks = allDesks.filter((desk) => desk.id !== selectedDesk.id);
      sessionStorage.setItem("Desks", JSON.stringify(updatedAllDesks));
      
      setSelectedDesk(null);
    }
  };
  
  const saveRoomDesign = () => {
    // Update RoomDesks in session storage
    sessionStorage.setItem("RoomDesks", JSON.stringify(desks));
    
    // Update the room's desks in the Rooms array
    const updatedRooms = JSON.parse(sessionStorage.getItem("Rooms") || "[]");
    const roomIndex = updatedRooms.findIndex(r => r.id === room.id);
    if (roomIndex !== -1) {
      updatedRooms[roomIndex] = { ...updatedRooms[roomIndex], desks };
      sessionStorage.setItem("Rooms", JSON.stringify(updatedRooms));
    }
  
    // Update SelectedRoom with new desks
    const selectedRoom = JSON.parse(sessionStorage.getItem("SelectedRoom") || "{}");
    sessionStorage.setItem("SelectedRoom", JSON.stringify({ ...selectedRoom, desks }));
  
    // Update Desks in session storage
    const allDesks = JSON.parse(sessionStorage.getItem("Desks") || "[]");
    const updatedAllDesks = allDesks.filter(desk => desk.roomId !== room.id);
    updatedAllDesks.push(...desks);
    sessionStorage.setItem("Desks", JSON.stringify(updatedAllDesks));
  
    alert("Desk layout saved successfully!");
  };

  const isPointInPolygon = (point, vertices) => {
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x, yi = vertices[i].y;
      const xj = vertices[j].x, yj = vertices[j].y;
      const intersect = ((yi > point.y) !== (yj > point.y))
          && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const handleDeskDragStart = (e) => {
    if (selectedDesk) {
      const stage = e.target.getStage();
      const mousePos = stage.getPointerPosition();
      setIsDraggingDesk(true);
      setDeskOffset({
        x: mousePos.x - selectedDesk.vertices[0].x,
        y: mousePos.y - selectedDesk.vertices[0].y,
      });
    }
  };

  const handleDeskDragMove = (e) => {
    if (isDraggingDesk && selectedDesk) {
      const stage = e.target.getStage();
      const mousePos = stage.getPointerPosition();
      const newX = snapToGrid(mousePos.x - deskOffset.x);
      const newY = snapToGrid(mousePos.y - deskOffset.y);
      
      const dx = newX - selectedDesk.vertices[0].x;
      const dy = newY - selectedDesk.vertices[0].y;
      
      const newVertices = selectedDesk.vertices.map(v => ({
        x: v.x + dx,
        y: v.y + dy,
      }));
      
      setTempDeskPosition(newVertices);
    }
  };

  const handleDeskDragEnd = () => {
    if (isDraggingDesk && selectedDesk && tempDeskPosition) {
      setDesks(prevDesks => prevDesks.map(desk => 
        desk.id === selectedDesk.id ? { ...desk, vertices: tempDeskPosition } : desk
      ));
      setSelectedDesk({ ...selectedDesk, vertices: tempDeskPosition });
      setTempDeskPosition(null);
    }
    setIsDraggingDesk(false);
  };

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw" }}>
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <div style={{ flex: "2", position: "relative", overflow: "hidden", backgroundColor: "white", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ border: "5px solid black" }}>
          <DynamicStage 
            width={stageWidth} 
            height={stageHeight} 
            onMouseDown={handleStageClick}
            onMouseMove={handleDeskDragMove}
            onMouseUp={handleDeskDragEnd}
            ref={stageRef}
          >
            <DynamicLayer>
              {/* Render grid lines */}
              {Array.from({ length: Math.ceil(stageWidth / gridSize) }).map((_, i) => (
                <Line
                  key={`vertical-${i}`}
                  points={[i * gridSize, 0, i * gridSize, stageHeight]}
                  stroke="gray"
                  strokeWidth={0.5}
                  opacity={gridOpacity}
                />
              ))}
              {Array.from({ length: Math.ceil(stageHeight / gridSize) }).map((_, i) => (
                <Line
                  key={`horizontal-${i}`}
                  points={[0, i * gridSize, stageWidth, i * gridSize]}
                  stroke="gray"
                  strokeWidth={0.5}
                  opacity={gridOpacity}
                />
              ))}
              {/* Render room */}
              {room && (
                <Shape
                  sceneFunc={(context, shape) => {
                    context.beginPath();
                    room.vertices.forEach((vertex, idx) => {
                      idx === 0 ? context.moveTo(vertex.x, vertex.y) : context.lineTo(vertex.x, vertex.y);
                    });
                    context.closePath();
                    context.fillStrokeShape(shape);
                  }}
                  fill={`rgba(173, 216, 230, ${roomOpacity})`}
                  stroke="blue"
                  strokeWidth={2}
                />
              )}
              {/* Render desks */}
              {desks.map((desk) => (
                <Shape
                  key={`desk-${desk.id}`}
                  sceneFunc={(context, shape) => {
                    context.beginPath();
                    desk.vertices.forEach((vertex, idx) => {
                      idx === 0 ? context.moveTo(vertex.x, vertex.y) : context.lineTo(vertex.x, vertex.y);
                    });
                    context.closePath();
                    context.fillStrokeShape(shape);
                  }}
                  fill={desk === selectedDesk
                    ? `${deskColors[desk.id]}CC`
                    : `${deskColors[desk.id]}${Math.round(deskOpacity * 255).toString(16).padStart(2, "0")}`}
                  stroke="black"
                  strokeWidth={1}
                />
              ))}
              {/* Render current desk being added */}
              {currentDesk.map((square, index) => (
                <Rect
                  key={`current-desk-square-${index}`}
                  x={square.x}
                  y={square.y}
                  width={gridSize}
                  height={gridSize}
                  fill="black"
                  opacity={0.5}
                />
              ))}
              {/* Render desk drag preview */}
              {tempDeskPosition && (
                <Shape
                  sceneFunc={(context, shape) => {
                    context.beginPath();
                    tempDeskPosition.forEach((vertex, idx) =>
                        idx === 0 ? context.moveTo(vertex.x, vertex.y) : context.lineTo(vertex.x, vertex.y)
                      );
                      context.closePath();
                      context.fillStrokeShape(shape);
                    }}
                    fill={`${deskColors[selectedDesk.id]}88`}
                    stroke="black"
                    strokeWidth={1}
                  />
                )}
                {/* Render red dot for desk movement */}
                {selectedDesk && (
                  <Circle
                    x={selectedDesk.vertices[0].x}
                    y={selectedDesk.vertices[0].y}
                    radius={5}
                    fill="red"
                    draggable
                    onDragStart={handleDeskDragStart}
                    onDragMove={handleDeskDragMove}
                    onDragEnd={handleDeskDragEnd}
                  />
                )}
              </DynamicLayer>
            </DynamicStage>
            </div>
          </div>
          {/* Control panel */}
          <div style={{
            flex: "1",
            padding: "15px",
            display: "flex",
            flexDirection: "column",
            color: "white",
            margin: 0,
            backgroundColor: "grey",
            height: "100%",
            overflowY: "auto",
            borderLeft: "5px black solid",
          }}>
            {/* Selected item info */}
            <div style={{ width: "100%", padding: "15px", height: "150px" }}>
              <div style={{ color: "white" }}>
                <h3>Selected Item:</h3>
                {room && <p>Room ID: {room.id}</p>}
                {selectedDesk && <p>Desk ID: {selectedDesk.id}</p>}
              </div>
            </div>
            {/* Desk design controls */}
            <div style={{ width: "100%", backgroundColor: "purple", padding: "15px" }}>
              <h2>Design Desks</h2>
              <button onClick={toggleAddDesk} style={{ backgroundColor: isAddingDesk ? "darkblue" : "blue", color: "white", padding: "10px", marginRight: "10px" }}>
                {isAddingDesk ? "Stop Adding Desk" : "Add Desk"}
              </button>
              {selectedDesk && (
                <button onClick={deleteSelectedDesk} style={{ backgroundColor: "red", color: "white", padding: "10px", marginRight: "10px" }}>
                  Delete Desk
                </button>
              )}
            </div>
            {/* Tools */}
            <div style={{ width: "100%", padding: "15px", marginTop: "auto", marginBottom: "0px" }}>
              <h2>Tools</h2>
              <div style={{ margin: "10px 0" }}>
                <label style={{ color: "white" }}>Grid Opacity: </label>
                <input type="range" min="0" max="1" step="0.01" value={gridOpacity} onChange={(e) => setGridOpacity(parseFloat(e.target.value))} />
              </div>
              <div style={{ margin: "10px 0" }}>
                <label style={{ color: "white" }}>Room Opacity: </label>
                <input type="range" min="0" max="1" step="0.01" value={roomOpacity} onChange={(e) => setRoomOpacity(parseFloat(e.target.value))} />
              </div>
              <div style={{ margin: "10px 0" }}>
                <label style={{ color: "white" }}>Desk Opacity: </label>
                <input type="range" min="0" max="1" step="0.01" value={deskOpacity} onChange={(e) => setDeskOpacity(parseFloat(e.target.value))} />
              </div>
            </div>
            <div style={{ width: "100%", marginTop: "auto", marginBottom: "0px", display: "flex", justifyContent: "space-between" }}>
               
                  <button onClick={handleBack} style={{ backgroundColor: "orange", color: "black", padding: "15px", width: '49%' }}>
                      Back
                  </button>
                  <button onClick={saveRoomDesign} style={{ backgroundColor: "blue", color: "white", padding: "15px", width: '49%' }}>
                      Save Room Design
                  </button>
              </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default RoomDesigner;