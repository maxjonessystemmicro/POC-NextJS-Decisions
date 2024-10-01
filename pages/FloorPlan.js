import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { Stage, Layer, Line, Circle, Shape, Image as KonvaImage } from 'react-konva';

const DynamicStage = dynamic(() => import('react-konva').then(mod => mod.Stage), { ssr: false });
const DynamicLayer = dynamic(() => import('react-konva').then(mod => mod.Layer), { ssr: false });

const gridSize = 20;
const PLOT_CONFIG = {
  width: 64,
  height: 45,
};

const SingleFloorPlan = () => {
  const [floorPlan, setFloorPlan] = useState(null);
  const [plotHeight, setPlotHeight] = useState(PLOT_CONFIG.height * gridSize);
  const [plotWidth, setPlotWidth] = useState(PLOT_CONFIG.width* gridSize);
  const [gridSizeValue, setGridSizeValue] = useState(gridSize);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [image, setImage] = useState(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isCustomRoom, setIsCustomRoom] = useState(false);
  const [isDrawingRoom, setIsDrawingRoom] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [previewPosition, setPreviewPosition] = useState(null);
  const [customVertices, setCustomVertices] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState([]);
  const [nextRoomId, setNextRoomId] = useState(1);

  const [imageObj, setImageObj] = useState(null);

  const [imageOpacity, setImageOpacity] = useState(1);
  const [gridOpacity, setGridOpacity] = useState(0.5);
  const [floorPlanOpacity, setFloorPlanOpacity] = useState(0.3);

  const [isComplete, setCompleteStatus] = useState(false);

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isDraggingRoom, setIsDraggingRoom] = useState(false);
  const [roomDragOffset, setRoomDragOffset] = useState({ x: 0, y: 0 });

  const [roomColors, setRoomColors] = useState({});

  const router = useRouter();

  const handleNavigation = () => {
    router.push('/RoomBuilder');
  };

  useEffect(() => {
    const storedData = sessionStorage.getItem('FloorPlanData');
    const storedImage = sessionStorage.getItem('ImageData');
    const storedImagePosition = sessionStorage.getItem('ImagePosition');
    const gridSize = sessionStorage.getItem('GridSize');
    const gridHeight = sessionStorage.getItem('GridHeight');
    const gridWidth = sessionStorage.getItem('GridWidth');
    const storedRooms = sessionStorage.getItem('Rooms');

    if (storedData) {
      setFloorPlan(JSON.parse(storedData));
    }else{
      //setFloorPlanSessionStorage();
    }

    if (storedImage) {
      setImage(storedImage);
      const img = new window.Image();
      img.src = storedImage;
      img.onload = () => setImageObj(img);
    }

    if (storedImagePosition) {
      setImagePosition(JSON.parse(storedImagePosition));
    }
    if (gridSize){
      setGridSizeValue(JSON.parse(gridSize));
    }
    if (gridHeight){
      setPlotHeight(JSON.parse(gridHeight));
    }
    if (gridWidth){
      setPlotWidth(JSON.parse(gridWidth));
    }
    if (storedRooms) {
      const parsedRooms = JSON.parse(storedRooms);
      setRooms(parsedRooms);
      // Generate random colors for rooms and set next room ID
      const newRoomColors = {};
      let maxId = 0;
      parsedRooms.forEach(room => {
        newRoomColors[room.id] = getRandomColor();
        maxId = Math.max(maxId, room.id);
      });
      setRoomColors(newRoomColors);
      setNextRoomId(maxId + 1);
    }
  }, []);

  const snapToGrid = (value) => Math.round(value / gridSizeValue) * gridSizeValue;


  const setFloorPlanSessionStorage = () =>{
    const floorPlanData = {
      "FloorPlanData": {
        "id": 1,
        "vertices": [
          {"x": 100, "y": 20},
          {"x": 100, "y": 320},
          {"x": 160, "y": 320},
          {"x": 160, "y": 360},
          {"x": 60, "y": 360},
          {"x": 60, "y": 780},
          {"x": 460, "y": 780},
          {"x": 460, "y": 720},
          {"x": 1000, "y": 720},
          {"x": 1000, "y": 440},
          {"x": 880, "y": 440},
          {"x": 880, "y": 140},
          {"x": 460, "y": 140},
          {"x": 460, "y": 20}
        ],
        "startShapePosition": {"x": 100, "y": 20}
      },
      "GridHeight": 800,
      "GridWidth": 1040,
      "GridSize": 20,
      
      "ImagePosition": {"x": 39, "y": 7},
      "Rooms": [
        {
          "id": 1,
          "floorPlanId": 1,
          "vertices": [
            {"x": 60, "y": 360},
            {"x": 240, "y": 360},
            {"x": 240, "y": 500},
            {"x": 60, "y": 500}
          ]
        },
        {
          "id": 2,
          "floorPlanId": 1,
          "vertices": [
            {"x": 60, "y": 500},
            {"x": 240, "y": 500},
            {"x": 240, "y": 620},
            {"x": 60, "y": 620}
          ]
        }
      ]
    };
  
    sessionStorage.setItem('FloorPlanData', JSON.stringify(floorPlanData.FloorPlanData));
    sessionStorage.setItem('GridHeight', JSON.stringify(floorPlanData.GridHeight));
    sessionStorage.setItem('GridWidth', JSON.stringify(floorPlanData.GridWidth));
    sessionStorage.setItem('GridSize', JSON.stringify(floorPlanData.GridSize));
    sessionStorage.setItem('ImageData', floorPlanData.ImageData);
    sessionStorage.setItem('ImagePosition', JSON.stringify(floorPlanData.ImagePosition));
    sessionStorage.setItem('Rooms', JSON.stringify(floorPlanData.Rooms));
  
    console.log('Floor plan data has been set in session storage.');

  }

  const isPointInPolygon = (point, vertices) => {
    let x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x, yi = vertices[i].y;
      const xj = vertices[j].x, yj = vertices[j].y;

      const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  };

  const handleDragStart = (e) => {
    if (!floorPlan || isDrawingRoom) return;
    setIsDragging(true);
    const stage = e.target.getStage();
    const mousePos = stage.getPointerPosition();

    setDragOffset({
      x: mousePos.x - floorPlan.startShapePosition.x,
      y: mousePos.y - floorPlan.startShapePosition.y,
    });
  };

  const handleDragMove = (e) => {
    const stage = e.target.getStage();
    const mousePos = stage.getPointerPosition();

    const newX = snapToGrid(mousePos.x - dragOffset.x);
    const newY = snapToGrid(mousePos.y - dragOffset.y);

    setPreviewPosition({ x: newX, y: newY });
  };

  const completeFloor = async () => {
    if(floorPlan && rooms.length > 0){
      setCompleteStatus(true);
      let FloorPlanDataPackage = {
        FloorPlanData: floorPlan,
        GridHeight: plotHeight,
        GridWidth: plotWidth,
        GridSize: gridSizeValue,
        ImageData: image,
        ImagePosition: imagePosition,
        Rooms: rooms,
      }

      try {
        console.log('The Data Package is: ', FloorPlanDataPackage);
        const response = await fetch('/api/createFloorPlan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(FloorPlanDataPackage),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const updatedData = await response.json();

        // Update the state with the new data
        setFloorPlan(updatedData.FloorPlanData);
        setPlotHeight(updatedData.GridHeight);
        setPlotWidth(updatedData.GridWidth);
        setGridSizeValue(updatedData.GridSize);
        setImage(updatedData.ImageData);
        setImagePosition(updatedData.ImagePosition);
        setRooms(updatedData.Rooms);

        // Update room colors with new IDs
        const newRoomColors = {};
        updatedData.Rooms.forEach(room => {
          newRoomColors[room.id] = getRandomColor();
        });
        setRoomColors(newRoomColors);

        console.log('Updated Floor Plan Data Package:', updatedData);
      } catch (error) {
        console.error('Error creating floor plan:', error);
        // Handle the error appropriately
      }
    }
  }

  const handleDragEnd = () => {
    if (!floorPlan) return;
    const newVertices = floorPlan.vertices.map(vertex => ({
      x: vertex.x + previewPosition.x - floorPlan.startShapePosition.x,
      y: vertex.y + previewPosition.y - floorPlan.startShapePosition.y,
    }));

    const updatedFloorPlan = {
      ...floorPlan,
      vertices: newVertices,
      startShapePosition: { x: previewPosition.x, y: previewPosition.y },
    };

    setFloorPlan(updatedFloorPlan);
    setIsDragging(false);
    setPreviewPosition(null);
  };

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const handleStageClick = (e) => {
    if (isDrawingRoom) {
      const stage = e.target.getStage();
      const mousePos = stage.getPointerPosition();
      const clickedPosition = {
        x: snapToGrid(mousePos.x),
        y: snapToGrid(mousePos.y),
      };

      setCurrentRoom(prevRoom => {
        if (prevRoom.length > 0 &&
            clickedPosition.x === prevRoom[0].x &&
            clickedPosition.y === prevRoom[0].y) {
          // Complete the room
          const newRoom = {
            id: nextRoomId,
            floorPlanId: floorPlan.id,
            vertices: prevRoom,
          };
          setRooms(prevRooms => [...prevRooms, newRoom]);
          setRoomColors(prevColors => ({
            ...prevColors,
            [nextRoomId]: getRandomColor(),
          }));
          setNextRoomId(prevId => prevId + 1);
          return [];
        }
        return [...prevRoom, clickedPosition];
      });
    } else if (isCustomRoom) {
      const stage = e.target.getStage();
      const mousePos = stage.getPointerPosition();
      const clickedPosition = {
        x: snapToGrid(mousePos.x),
        y: snapToGrid(mousePos.y),
      };

      setCustomVertices(prevVertices => {
        if (prevVertices.length > 0 &&
            clickedPosition.x === prevVertices[0].x &&
            clickedPosition.y === prevVertices[0].y) {
          const newFloorPlan = {
            id: 1,
            vertices: prevVertices,
            startShapePosition: { x: prevVertices[0].x, y: prevVertices[0].y },
          };
          setFloorPlan(newFloorPlan);
          setCustomVertices([]);
          setIsCustomRoom(false);
        }
        return [...prevVertices, clickedPosition];
      });
    } else {
      const stage = e.target.getStage();
      const mousePos = stage.getPointerPosition();
      const clickedPosition = {
        x: snapToGrid(mousePos.x),
        y: snapToGrid(mousePos.y),
      };

      // Check if a room was clicked
      const clickedRoom = rooms.find(room => isPointInPolygon(clickedPosition, room.vertices));
      setSelectedRoom(clickedRoom || null);
    }
  };

  const toggleCustomRoom = () => {
    setIsCustomRoom(!isCustomRoom);
    if (!isCustomRoom) {
      setCustomVertices([]);
    }
  };

  const toggleDrawRoom = () => {
    setIsDrawingRoom(!isDrawingRoom);
    setIsCustomRoom(false);
    setCustomVertices([]);
    if (!isDrawingRoom) {
      setCurrentRoom([]);
    }
  };

  const clearFloorPlanData = () => {
    setFloorPlan(null);
    setCustomVertices([]);
    setRooms([]);
    setCurrentRoom([]);
    setSelectedRoom(null);
    setRoomColors({});
    setNextRoomId(1);
    sessionStorage.removeItem('FloorPlanData');
    sessionStorage.removeItem('GridSize');
    sessionStorage.removeItem('GridHeight');
    sessionStorage.removeItem('GridWidth');
    sessionStorage.removeItem('ImageData');
    sessionStorage.removeItem('ImagePosition');
    sessionStorage.removeItem('IsComplete');
    sessionStorage.removeItem('Rooms');
    alert('Floor plan data cleared!');
  };

  const saveFloorPlan = () => {
    sessionStorage.setItem('FloorPlanData', JSON.stringify(floorPlan));
    sessionStorage.setItem('GridSize', JSON.stringify(gridSize));
    sessionStorage.setItem('GridHeight', JSON.stringify(plotHeight));
    sessionStorage.setItem('GridWidth', JSON.stringify(plotWidth));
    sessionStorage.setItem('ImagePosition', JSON.stringify(imagePosition));
    sessionStorage.setItem('Rooms', JSON.stringify(rooms));
    alert('Floor plan saved!');
  };

  const resetFloorPlan = () => {
    sessionStorage.setItem('FloorPlanData', JSON.stringify(null));
    setFloorPlan(null);
    setCustomVertices([]);
    setRooms([]);
    setCurrentRoom([]);
    setSelectedRoom(null);
    setRoomColors({});
    setNextRoomId(1);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.src = reader.result;
        img.onload = () => {
          setImageObj(img);
        };
        setImage(reader.result);
        sessionStorage.setItem('ImageData', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const scaleImage = (img) => {
    const scale = Math.min(plotWidth / img.width, plotHeight / img.height);
    return {
      width: img.width * scale,
      height: img.height * scale,
      x: imagePosition.x,
      y: imagePosition.y,
    };
  };

  const moveImage = (dx, dy) => {
    const newPosition = { x: imagePosition.x + dx, y: imagePosition.y + dy };
    setImagePosition(newPosition);
  };

  const handleGridSizeChange = (e) => {
    const newGridSize = Math.min(Number(e.target.value), 100);
    setGridSizeValue(newGridSize);
  };

  const handleHeightChange = (e) => {
    const newHeight = Math.min(Number(e.target.value), 100);
    setPlotHeight(newHeight * gridSizeValue);
  };

  const handleWidthChange = (e) => {
    const newWidth = Math.min(Number(e.target.value), 100);
    setPlotWidth(newWidth * gridSizeValue);
  };

  const handleRoomDragStart = (e) => {
    if (!selectedRoom) return;
    setIsDraggingRoom(true);
    const stage = e.target.getStage();
    const mousePos = stage.getPointerPosition();

    setRoomDragOffset({
      x: mousePos.x - selectedRoom.vertices[0].x,
      y: mousePos.y - selectedRoom.vertices[0].y,
    });
  };

  const handleRoomDragMove = (e) => {
    if (!isDraggingRoom || !selectedRoom) return;
    const stage = e.target.getStage();
    const mousePos = stage.getPointerPosition();

    const newX = snapToGrid(mousePos.x - roomDragOffset.x);
    const newY = snapToGrid(mousePos.y - roomDragOffset.y);

    const dx = newX - selectedRoom.vertices[0].x;
    const dy = newY - selectedRoom.vertices[0].y;

    const updatedRoom = {
      ...selectedRoom,
      vertices: selectedRoom.vertices.map(vertex => ({
        x: vertex.x + dx,
        y: vertex.y + dy,
      }))
    };

    setSelectedRoom(updatedRoom);
  };

  const handleRoomDragEnd = () => {
    if (!isDraggingRoom || !selectedRoom) return;
    setIsDraggingRoom(false);

    setRooms(prevRooms => prevRooms.map(room => 
      room.id === selectedRoom.id ? selectedRoom : room
    ));
  };

  const deleteSelectedRoom = () => {
    if (selectedRoom) {
      setRooms(prevRooms => prevRooms.filter(room => room.id !== selectedRoom.id));
      setRoomColors(prevColors => {
        const newColors = {...prevColors};
        delete newColors[selectedRoom.id];
        return newColors;
      });
      setSelectedRoom(null);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <div style={{ 
        flex: '2', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        position: 'relative',
        backgroundColor: 'white' 
      }}>
        <DynamicStage
          width={plotWidth + 1} 
          height={plotHeight + 1} 
          onClick={handleStageClick}
          onMouseDown={handleRoomDragStart}
          onMouseMove={handleRoomDragMove}
          onMouseUp={handleRoomDragEnd}
          style={{ display: 'block', border: '1px solid black' }} 
        >
          <DynamicLayer>
            {imageObj && (
              <KonvaImage
                image={imageObj}
                width={scaleImage(imageObj).width}
                height={scaleImage(imageObj).height}
                x={imagePosition.x}
                y={imagePosition.y}
                opacity={imageOpacity}
                zIndex={-1}
              />
            )}

            {Array.from({ length: Math.ceil(plotWidth / gridSizeValue) + 1 }).map((_, i) => (
              <Line key={`v-${i}`} points={[i * gridSizeValue, 0, i * gridSizeValue, plotHeight]} stroke="darkgrey" opacity={gridOpacity} />
            ))}
            {Array.from({ length: Math.ceil(plotHeight / gridSizeValue) + 1 }).map((_, i) => (
              <Line key={`h-${i}`} points={[0, i * gridSizeValue, plotWidth, i * gridSizeValue]} stroke="darkgrey" opacity={gridOpacity} />
            ))}

            {floorPlan && (
              <Shape
                key={floorPlan.id}
                sceneFunc={(context) => {
                  context.beginPath();
                  floorPlan.vertices.forEach((vertex, idx) => {
                    const x = vertex.x;
                    const y = vertex.y;
                    if (idx === 0) {
                      context.moveTo(x, y);
                    } else {
                      context.lineTo(x, y);
                    }
                  });
                  context.closePath();
                  context.fillStyle = `rgba(173, 216, 230, ${floorPlanOpacity})`;
                  context.fill();
                  context.strokeStyle = 'black';
                  context.stroke();
                }}
              />
            )}

            {isDragging && previewPosition && floorPlan &&  (
              <Shape
                sceneFunc={(context) => {
                  context.beginPath();
                  floorPlan.vertices.forEach((vertex, idx) => {
                    const x = vertex.x + previewPosition.x - floorPlan.startShapePosition.x;
                    const y = vertex.y + previewPosition.y - floorPlan.startShapePosition.y;
                    if (idx === 0) {
                      context.moveTo(x, y);
                    } else {
                      context.lineTo(x, y);
                    }
                  });
                  context.closePath();
                  context.fillStyle = `rgba(173, 216, 230, ${floorPlanOpacity + 0.2})`;
                  context.fill();
                  context.strokeStyle = 'blue';
                  context.stroke();
                }}
              />
            )}

            {floorPlan && !isDrawingRoom && (
              <Circle
                key={`axis-point-${floorPlan.id}`}
                x={floorPlan.startShapePosition.x}
                y={floorPlan.startShapePosition.y}
                radius={8}
                fill="red"
                stroke="black"
                strokeWidth={2}
                draggable
                onDragStart={handleDragStart}
                onDragMove={handleDragMove}
                onDragEnd={handleDragEnd}
              />
            )}

            {customVertices.map((vertex, index) => (
              <Circle
                key={index}
                x={vertex.x}
                y={vertex.y}
                radius={5}
                fill="blue"
              />
            ))}

            {customVertices.map((vertex, index) => {
              if (index < customVertices.length - 1) {
                return (
                  <Line
                    key={`line-${index}`}
                    points={[vertex.x, vertex.y, customVertices[index + 1].x, customVertices[index + 1].y]}
                    stroke="blue"
                    strokeWidth={2}
                  />
                );
              }
              return null;
            })}

            {rooms.map((room) => (
              <Shape
                key={`room-${room.id}`}
                sceneFunc={(context) => {
                  context.beginPath();
                  room.vertices.forEach((vertex, idx) => {
                    if (idx === 0) {
                      context.moveTo(vertex.x, vertex.y);
                    } else {
                      context.lineTo(vertex.x, vertex.y);
                    }
                  });
                  context.closePath();
                  context.fillStyle = room === selectedRoom 
                    ? `${roomColors[room.id]}CC`  // CC for 80% opacity
                    : `${roomColors[room.id]}99`;  // 99 for 60% opacity
                  context.fill();
                  context.strokeStyle = room === selectedRoom ? 'blue' : 'black';
                  context.stroke();
                }}
              />
            ))}

            {currentRoom.map((vertex, index) => (
              <Circle
                key={`current-room-point-${index}`}
                x={vertex.x}
                y={vertex.y}
                radius={5}
                fill="green"
              />
            ))}

            {currentRoom.map((vertex, index) => {
              if (index < currentRoom.length - 1) {
                return (
                  <Line
                    key={`current-room-line-${index}`}
                    points={[vertex.x, vertex.y, currentRoom[index + 1].x, currentRoom[index + 1].y]}
                    stroke="green"
                    strokeWidth={2}
                  />
                );
              }
              return null;
            })}

            {selectedRoom && (
              <Circle
                x={selectedRoom.vertices[0].x}
                y={selectedRoom.vertices[0].y}
                radius={8}
                fill="red"
                stroke="black"
                strokeWidth={2}
                draggable
                onDragStart={handleRoomDragStart}
                onDragMove={handleRoomDragMove}
                onDragEnd={handleRoomDragEnd}
              />
            )}
          </DynamicLayer>
        </DynamicStage>

        {imageObj && (
          <div style={{ position: 'absolute', top: '50%', left: '100%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', marginLeft: '10px' }}>
            <button onClick={() => moveImage(0, -1)} style={{ margin: '5px', padding: '10px', background: 'lightgrey', border: 'none', borderRadius: '5px' }}>↑</button>
            <button onClick={() => moveImage(1, 0)} style={{ margin: '5px', padding: '10px', background: 'lightgrey', border: 'none', borderRadius: '5px' }}>→</button>
            <button onClick={() => moveImage(-1, 0)} style={{ margin: '5px', padding: '10px', background: 'lightgrey', border: 'none', borderRadius: '5px' }}>←</button>
            <button onClick={() => moveImage(0, 1)} style={{ margin: '5px', padding: '10px', background: 'lightgrey', border: 'none', borderRadius: '5px' }}>↓</button>
          </div>
        )}
      </div>

      <div style={{ flex: '1', padding: '0px', display: 'flex', flexDirection: 'column', color: 'white', margin: 0, backgroundColor: 'grey', height: '100%', overflowY: 'auto' }}>
        <div style={{ flexGrow: 1, padding: '15px' }}>
         
        </div>

        <div>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            style={{ margin: '10px 0' }} 
            disabled={isDrawingRoom}
          />
          
          <button 
            onClick={clearFloorPlanData} 
            style={{ 
              backgroundColor: 'red', 
              color: 'white', 
              padding: '10px', 
              margin: '10px' 
            }}
            disabled={isDrawingRoom}
          >
            {'Clear'}
          </button>
          
          <button 
            onClick={toggleCustomRoom} 
            style={{ 
              backgroundColor: 'green', 
              color: 'white', 
              padding: '10px', 
              margin: '10px' 
            }}
            disabled={floorPlan || isDrawingRoom}
          >
            {'Draw Floorplan'}
          </button>
              
          <button 
            onClick={toggleDrawRoom} 
            style={{ 
              backgroundColor: isDrawingRoom ? 'darkgreen' : 'teal', 
              color: 'white', 
              padding: '10px', 
              margin: '10px' 
            }}
            disabled={!floorPlan}
          >
            {isDrawingRoom ? 'Stop Drawing Room' : 'Draw Room'}
          </button>
          <button 
            onClick={resetFloorPlan} 
            style={{ 
              backgroundColor: 'Orange', 
              color: 'white', 
              padding: '10px', 
              margin: '10px' 
            }}
            disabled={isDrawingRoom}
          >
            Reset
          </button>
          <button 
            onClick={saveFloorPlan} 
            style={{ 
              backgroundColor: 'blue', 
              color: 'white', 
              padding: '10px', 
              margin: '10px' 
            }}
          >
            Save
          </button>
          {selectedRoom && (
            <button 
              onClick={deleteSelectedRoom} 
              style={{ 
                backgroundColor: 'purple', 
                color: 'white', 
                padding: '10px', 
                margin: '10px' 
              }}
            >
              Delete Room
            </button>
          )}
        </div>

        <div style={{ margin: '10px 0' }}>
          <label style={{ color: 'white' }}>Image Opacity: </label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={imageOpacity} 
            onChange={(e) => setImageOpacity(parseFloat(e.target.value))} 
          />
        </div>
        <div style={{ margin: '10px 0' }}>
          <label style={{ color: 'white' }}>Grid Opacity: </label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={gridOpacity} 
            onChange={(e) => setGridOpacity(parseFloat(e.target.value))} 
          />
        </div>
        <div style={{ margin: '10px 0' }}>
          <label style={{ color: 'white' }}>Floor Plan Fill Opacity: </label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={floorPlanOpacity} 
            onChange={(e) => setFloorPlanOpacity(parseFloat(e.target.value))} 
          />
        </div>

        <div style={{ margin: '10px 0' }}>
          <label style={{ color: 'white' }}>Grid Size: </label>
          <input 
            type="number" 
            value={gridSizeValue} 
            onChange={handleGridSizeChange} 
            style={{ width: '50px', marginLeft: '5px',color:'black'  }} 
            disabled={isDrawingRoom}
          />
        </div>

        <div style={{ margin: '10px 0' }}>
          <label style={{ color: 'white' }}>Height (ft): </label>
          <input 
            type="number" 
            value={plotHeight / gridSizeValue} 
            onChange={handleHeightChange} 
            style={{ width: '50px', marginLeft: '5px',color:'black'  }} 
            disabled={isDrawingRoom}
          />
        </div>

        <div style={{ margin: '10px 0' }}>
          <label style={{ color: 'white' }}>Width (ft): </label>
          <input 
            type="number" 
            value={plotWidth / gridSizeValue} 
            onChange={handleWidthChange} 
            style={{ width: '50px', marginLeft: '5px',color:'black' }} 
            disabled={isDrawingRoom}
          />
        </div>
          <button 
            onClick={completeFloor} 
            style={{ 
              backgroundColor: 'blue', 
              color: 'white', 
              width: '250px',
              padding: '10px', 
              margin: '10px' 
            }}
          >
            Complete
          </button>
      </div>
    </div>
  );
};

export default SingleFloorPlan;