import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import {
  Stage,
  Layer,
  Line,
  Circle,
  Shape,
  Image as KonvaImage,
  Rect,
} from "react-konva";

// Dynamically import Konva components to avoid server-side rendering issues
const DynamicStage = dynamic(
  () => import("react-konva").then((mod) => mod.Stage),
  { ssr: false }
);
const DynamicLayer = dynamic(
  () => import("react-konva").then((mod) => mod.Layer),
  { ssr: false }
);

const gridSize = 20;
const PLOT_CONFIG = { width: 54, height: 38 };

const RoomDesigner = () => {
  // State variables for managing floor plan data and UI states
  const [floorPlan, setFloorPlan] = useState(null);
  const [plotHeight, setPlotHeight] = useState(PLOT_CONFIG.height * gridSize);
  const [plotWidth, setPlotWidth] = useState(PLOT_CONFIG.width * gridSize);
  const [gridSizeValue, setGridSizeValue] = useState(gridSize);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [image, setImage] = useState(null);
  const [isCustomRoom, setIsCustomRoom] = useState(false);
  const [isDrawingRoom, setIsDrawingRoom] = useState(false);
  const [customVertices, setCustomVertices] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState([]);
  const [floorName, setFloorName] = useState("");
  const [floorNumber, setFloorNumber] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  const [imageObj, setImageObj] = useState(null);
  const [imageOpacity, setImageOpacity] = useState(1);
  const [gridOpacity, setGridOpacity] = useState(0.5);
  const [floorPlanOpacity, setFloorPlanOpacity] = useState(0.3);
  const [roomOpacity, setRoomOpacity] = useState(0.5);
  const [deskOpacity, setDeskOpacity] = useState(0.5);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomColors, setRoomColors] = useState({});
  const [isAddingDesk, setIsAddingDesk] = useState(false);
  const [currentDesk, setCurrentDesk] = useState([]);
  const [desks, setDesks] = useState([]);
  const [type, setType] = useState(null);

  const [selectedDesk, setSelectedDesk] = useState(null);
  const [deskColors, setDeskColors] = useState({});
  const [isDraggingDesk, setIsDraggingDesk] = useState(false);
  const [deskOffset, setDeskOffset] = useState({ x: 0, y: 0 });
  const [tempDeskPosition, setTempDeskPosition] = useState(null);

  const [Creater_Account_ID, setCreater_Account_ID] = useState(
    "01HGDVRVHW8YZ0KESEY6EPA71Q"
  );

  let [RoomIndex, setRoomIndex] = useState(0);
  let [DeskIndex, setDeskIndex] = useState(0);

  const stageRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (
      sessionStorage.getItem("FloorPlan") &&
      sessionStorage.getItem("GridSize") &&
      sessionStorage.getItem("GridHeight") &&
      sessionStorage.getItem("GridWidth")
    ) {
      let gridSize = JSON.parse(sessionStorage.getItem("GridSize"));
      let selectedRoom = JSON.parse(sessionStorage.getItem("SelectedRoom"));

      // Calculate room dimensions
      let minX = Math.min(...selectedRoom.Vertices.map((v) => v.x));
      let maxX = Math.max(...selectedRoom.Vertices.map((v) => v.x));
      let minY = Math.min(...selectedRoom.Vertices.map((v) => v.y));
      let maxY = Math.max(...selectedRoom.Vertices.map((v) => v.y));

      let roomWidth = maxX - minX;
      let roomHeight = maxY - minY;

      // Calculate new plot dimensions with padding
      let plotWidth = roomWidth + 0 * gridSize;
      let plotHeight = roomHeight + 0 * gridSize;

      // Calculate offset to center the room
      let offsetX = (plotWidth - roomWidth) / 2 - minX;
      let offsetY = (plotHeight - roomHeight) / 2 - minY;

      setOffsetX(offsetX);
      setOffsetY(offsetY);

      // Update room vertices to center it in the new plot
      let centeredRoom = {
        ...selectedRoom,
        Vertices: selectedRoom.Vertices.map((v) => ({
          x: v.x + offsetX,
          y: v.y + offsetY,
        })),
      };

      setFloorPlan(JSON.parse(sessionStorage.getItem("FloorPlan")));
      setPlotHeight(plotHeight);
      setPlotWidth(plotWidth);
      setSelectedRoom(centeredRoom);

      // If you have a rooms state, update it as well
      setRooms([centeredRoom]);
      setRoomColors({
        [centeredRoom.Internal_ID]: getRandomColor(),
      });

      // If you have desks, center them too
      if (sessionStorage.getItem("desks")) {
        let desks = JSON.parse(sessionStorage.getItem("desks"));
        if (desks) {
          //filter desks that are in the room
          let roomDesks = desks.filter(
            (desk) => desk.Room_ID === centeredRoom.ID
          );

          //using the offset update the desk vertices
          let centeredDesks = roomDesks.map((desk) => ({
            ...desk,
            Vertices: desk.Vertices.map((v) => ({
              x: v.x + offsetX,
              y: v.y + offsetY,
            })),
          }));

          setDesks(centeredDesks);
          const newDeskColors = {};
          centeredDesks.forEach((desk) => {
            newDeskColors[parseInt(desk.Internal_ID)] = getRandomColor();
          });
          setDeskColors(newDeskColors);
        }
      }
      // Update grid size
      setGridSizeValue(gridSize);
    }
  }, []);

  const saveDesks = async () => {
    //using the offset update the desk vertices
    let alignedDesks = desks.map((desk) => ({
      ...desk,
      Vertices: desk.Vertices.map((v) => ({
        x: v.x - offsetX,
        y: v.y - offsetY,
      })),
    }));

    // seperate new vs old desks and only update existing from the routes.
    let newDesks = alignedDesks.filter((desk) => desk.id === null);
    let existingDesks = alignedDesks.filter((desk) => desk.id !== null);

    if (newDesks.length > 0) {
      try {
        const response = await fetch("/api/NewDeskAPI", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            Desks: newDesks,
          }),
        });

        const responseText = await response.text();

        if (!response.ok) {
          throw new Error(
            `Network response was not ok: ${response.status} ${response.statusText}\n${responseText}`
          );
        } else {
          alert("Successful!!");
        }
      } catch (error) {
        console.error("Error creating floor plan:", error);
        alert(
          "An error occurred while completing the floor plan. Please check the console for more details."
        );
      }
    }
    if (existingDesks.length > 0) {
      try {
        const response = await fetch("/api/editDesksAPI", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            Desks: existingDesks,
          }),
        });

        const responseText = await response.text();

        if (!response.ok) {
          throw new Error(
            `Network response was not ok: ${response.status} ${response.statusText}\n${responseText}`
          );
        } else {
          alert("Successful!!");
        }
      } catch (error) {
        console.error("Error creating floor plan:", error);
        alert(
          "An error occurred while completing the floor plan. Please check the console for more details."
        );
      }
    }
  };

  // Snap a value to the nearest grid point
  const snapToGrid = (value) =>
    Math.round(value / gridSizeValue) * gridSizeValue;

  // Navigate back to the previous page
  const backButton = async () => {
    let alignedDesks = desks.map((desk) => ({
      ...desk,
      Vertices: desk.Vertices.map((v) => ({
        x: v.x - offsetX,
        y: v.y - offsetY,
      })),
    }));
    sessionStorage.setItem("desks", JSON.stringify(alignedDesks));
    window.history.back();
  };

  // Generate a random color
  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // Handle clicks on the stage
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
        isPointInPolygon(clickedPosition, desk.Vertices)
      );
      setSelectedDesk(clickedDesk || null);
    }
  };

  // Toggle desk adding mode
  const toggleAddDesk = () => {
    setIsAddingDesk(!isAddingDesk);
    if (isAddingDesk) {
      if (currentDesk.length > 0) {
        const Vertices = squaresToVertices(currentDesk);
        const newDesk = {
          id: null,
          FloorPlan_ID: floorPlan.ID,
          Vertices: Vertices,
          Internal_ID: parseInt(DeskIndex) + 1,
          Creater_Account_ID: Creater_Account_ID,
          Room_ID: selectedRoom.ID,
        };
        setDesks((prevDesks) => [...prevDesks, newDesk]);
        setDeskIndex(DeskIndex + 1);
        setDeskColors((prevColors) => ({
          ...prevColors,
          [newDesk.Internal_ID]: getRandomColor(),
        }));
        setCurrentDesk([]);
      }
    }
  };

  // Convert squares to vertices for desk creation
  const squaresToVertices = (squares) => {
    const minX = Math.min(...squares.map((s) => s.x));
    const minY = Math.min(...squares.map((s) => s.y));
    const maxX = Math.max(...squares.map((s) => s.x)) + gridSizeValue;
    const maxY = Math.max(...squares.map((s) => s.y)) + gridSizeValue;

    const edges = new Set();
    squares.forEach((square) => {
      edges.add(`${square.x},${square.y}`);
      edges.add(`${square.x + gridSizeValue},${square.y}`);
      edges.add(`${square.x},${square.y + gridSizeValue}`);
      edges.add(`${square.x + gridSizeValue},${square.y + gridSizeValue}`);
    });

    const Vertices = [];
    let x = minX,
      y = minY;
    let direction = 0; // 0: right, 1: down, 2: left, 3: up

    do {
      if (edges.has(`${x},${y}`)) {
        Vertices.push({ x, y });
        direction = (direction + 3) % 4;
      } else {
        direction = (direction + 1) % 4;
      }

      switch (direction) {
        case 0:
          x += gridSizeValue;
          break;
        case 1:
          y += gridSizeValue;
          break;
        case 2:
          x -= gridSizeValue;
          break;
        case 3:
          y -= gridSizeValue;
          break;
      }
    } while (x !== minX || y !== minY);

    return Vertices;
  };

  // Handle changes to the floor name
  const handleFloorName = (e) => {
    const newName = e.target.value;
    if (newName) {
      setFloorName(newName);
    }
  };

  // Delete the selected desk
  const deleteSelectedDesk = () => {
    if (selectedDesk) {
      setDesks((prevDesks) =>
        prevDesks.filter(
          (desk) => desk.Internal_ID !== selectedDesk.Internal_ID
        )
      );
      setSelectedDesk(null);
    }
  };

  // Check if a point is inside a polygon
  const isPointInPolygon = (point, Vertices) => {
    let inside = false;
    for (let i = 0, j = Vertices.length - 1; i < Vertices.length; j = i++) {
      const xi = Vertices[i].x,
        yi = Vertices[i].y;
      const xj = Vertices[j].x,
        yj = Vertices[j].y;
      const intersect =
        yi > point.y !== yj > point.y &&
        point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  };

  // Handle the start of desk dragging
  const handleDeskDragStart = (e) => {
    if (selectedDesk) {
      const stage = e.target.getStage();
      const mousePos = stage.getPointerPosition();
      setIsDraggingDesk(true);
      setDeskOffset({
        x: mousePos.x - selectedDesk.Vertices[0].x,
        y: mousePos.y - selectedDesk.Vertices[0].y,
      });
    }
  };

  // Handle desk dragging movement
  const handleDeskDragMove = (e) => {
    if (isDraggingDesk && selectedDesk) {
      const stage = e.target.getStage();
      const mousePos = stage.getPointerPosition();
      const newX = snapToGrid(mousePos.x - deskOffset.x);
      const newY = snapToGrid(mousePos.y - deskOffset.y);

      const dx = newX - selectedDesk.Vertices[0].x;
      const dy = newY - selectedDesk.Vertices[0].y;

      const newVertices = selectedDesk.Vertices.map((v) => ({
        x: v.x + dx,
        y: v.y + dy,
      }));

      setTempDeskPosition({
        Internal_ID: selectedDesk.Internal_ID,
        Vertices: newVertices,
      });
    }
  };

  // Handle the end of desk dragging
  const handleDeskDragEnd = () => {
    if (isDraggingDesk && selectedDesk && tempDeskPosition) {
      setDesks((prevDesks) =>
        prevDesks.map((desk) =>
          desk.Internal_ID === tempDeskPosition.Internal_ID
            ? { ...desk, Vertices: tempDeskPosition.Vertices }
            : desk
        )
      );
      setSelectedDesk({ ...selectedDesk, Vertices: tempDeskPosition.Vertices });
      setTempDeskPosition(null);
    }
    setIsDraggingDesk(false);
  };

  return (
    <div
      style={{
        backgroundColor: "white",
        display: "flex",
        fontFamily: "Nunito, sans-serif",
      }}
    >
      <div style={{ width: "270px", backgroundColor: "#25316F" }}>
        {/* Sidebar content */}
      </div>

      <div
        style={{
          flex: 2,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          width: "100vw",
        }}
      >
        <div
          style={{
            height: "60px",
            backgroundColor: "#384A8E",
            borderLeft: "10px solid #0092D1",
            display: "flex",
            alignItems: "center", // Vertically center the content
            paddingLeft: "20px", // Add some padding for left alignment
          }}
        >
          <span
            style={{ color: "white", fontSize: "20px", fontWeight: "bold" }}
          >
            Real Estate Management
          </span>
        </div>

        <div style={{ flex: 1, display: "flex" }}>
          <div
            style={{
              position: "relative",
              overflow: "auto",
              backgroundColor: "white",
              padding: "20px",
              boxSizing: "border-box",
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                border: "3px solid #D6D6D6",
                backgroundColor: "white",
                padding: "20px",
                display: "inline-block",
              }}
            >
              <DynamicStage
                width={plotWidth}
                height={plotHeight}
                onMouseDown={handleStageClick}
                onMouseMove={handleDeskDragMove}
                onMouseUp={handleDeskDragEnd}
                ref={stageRef}
              >
                <DynamicLayer>
                  {imageObj && (
                    <KonvaImage
                      image={imageObj}
                      x={imagePosition.x}
                      y={imagePosition.y}
                      {...scaleImage(imageObj)}
                      opacity={imageOpacity}
                    />
                  )}
                  {Array.from({ length: plotWidth / gridSizeValue }).map(
                    (_, i) => (
                      <Line
                        key={`vertical-${i}`}
                        points={[
                          i * gridSizeValue,
                          0,
                          i * gridSizeValue,
                          plotHeight,
                        ]}
                        stroke="gray"
                        strokeWidth={0.5}
                        opacity={gridOpacity}
                      />
                    )
                  )}
                  {Array.from({ length: plotHeight / gridSizeValue }).map(
                    (_, i) => (
                      <Line
                        key={`horizontal-${i}`}
                        points={[
                          0,
                          i * gridSizeValue,
                          plotWidth,
                          i * gridSizeValue,
                        ]}
                        stroke="gray"
                        strokeWidth={0.5}
                        opacity={gridOpacity}
                      />
                    )
                  )}

                  {rooms.map((room) => (
                    <Shape
                      key={`room-${room.Internal_ID}`}
                      sceneFunc={(context) => {
                        context.beginPath();
                        room.Vertices.forEach((vertex, idx) => {
                          idx === 0
                            ? context.moveTo(vertex.x, vertex.y)
                            : context.lineTo(vertex.x, vertex.y);
                        });
                        context.closePath();
                        context.fillStyle =
                          room === selectedRoom
                            ? `${roomColors[room.Internal_ID]}CC`
                            : `${roomColors[room.Internal_ID]}${Math.round(
                                roomOpacity * 255
                              )
                                .toString(16)
                                .padStart(2, "0")}`;
                        context.fill();
                        context.strokeStyle =
                          room === selectedRoom ? "blue" : "black";
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
                          points={[
                            vertex.x,
                            vertex.y,
                            currentRoom[index + 1].x,
                            currentRoom[index + 1].y,
                          ]}
                          stroke="green"
                          strokeWidth={2}
                        />
                      );
                    }
                    return null;
                  })}
                  {desks.map((desk) => (
                    <Shape
                      key={`desk-${desk.Internal_ID}`}
                      sceneFunc={(context) => {
                        context.beginPath();
                        desk.Vertices.forEach((vertex, idx) => {
                          idx === 0
                            ? context.moveTo(vertex.x, vertex.y)
                            : context.lineTo(vertex.x, vertex.y);
                        });
                        context.closePath();
                        context.fillStyle =
                          desk.Internal_ID === selectedDesk?.Internal_ID
                            ? `${deskColors[desk.Internal_ID]}CC`
                            : `${deskColors[desk.Internal_ID]}${Math.round(
                                deskOpacity * 255
                              )
                                .toString(16)
                                .padStart(2, "0")}`;
                        context.fill();
                        context.strokeStyle = "black";
                        context.stroke();
                      }}
                      onClick={() => setSelectedDesk(desk)}
                    />
                  ))}
                  {currentDesk.map((square, index) => (
                    <Rect
                      key={`current-desk-square-${index}`}
                      x={square.x}
                      y={square.y}
                      width={gridSizeValue}
                      height={gridSizeValue}
                      fill="black"
                      opacity={0.5}
                    />
                  ))}
                  {selectedDesk && (
                    <Circle
                      x={selectedDesk.Vertices[0].x}
                      y={selectedDesk.Vertices[0].y}
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

          <div
            style={{
              flex: "1",
              display: "flex",
              flexDirection: "column",
              color: "white",
              margin: 0,
              backgroundColor: "#25316F",
              height: "100%",
              overflowY: "auto",
            }}
          >
            <div style={{ width: "100%", padding: "15px", paddingTop: "12px" }}>
              <div style={{ color: "white", textAlign: "center" }}>
                <label
                  style={{
                    color: "white",
                    fontSize: "20px",
                    fontWeight: "bold",
                    display: "block",
                    marginBottom: "10px",
                  }}
                >
                  Room Designer
                </label>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    padding: "5px",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ marginRight: "15px" }}>
                    <label style={{ color: "white", marginRight: "5px" }}>
                      Name:{" "}
                      <span
                        style={{
                          color: "red",
                          display: floorName.name ? "none" : "none",
                        }}
                      >
                        *
                      </span>
                    </label>
                    <input
                      value={floorName}
                      onChange={handleFloorName}
                      style={{
                        borderRadius: "5px",
                        padding: "2px",
                        width: "150px",
                        color: "black",
                        borderColor: floorName ? "initial" : "initial",
                        borderWidth: "1px",
                        borderStyle: "solid",
                      }}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ width: "100%", position: "relative" }}>
              {!floorPlan && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(128, 128, 128, 0.5)",
                    zIndex: 1,
                    pointerEvents: "none", // Prevent interaction
                  }}
                />
              )}
            </div>
            <div style={{ width: "100%", position: "relative" }}>
              <div
                style={{
                  backgroundColor: "#384A8E",
                  padding: "15px",
                  zIndex: 0,
                }}
              >
                <h2 style={{ fontSize: "16px", fontWeight: "bold" }}>
                  Design Desks
                </h2>
                <button
                  onClick={toggleAddDesk}
                  style={{
                    backgroundColor: isAddingDesk ? "blue" : "darkblue",
                    color: "white",
                    padding: "11px",
                    marginRight: "10px",
                    borderRadius: "6px",
                  }}
                >
                  {isAddingDesk ? "Stop Adding Desk" : "Add Desk"}
                </button>
                {selectedDesk && (
                  <button
                    onClick={deleteSelectedDesk}
                    disabled={!floorPlan || isDrawingRoom || !rooms.length}
                    style={{
                      backgroundColor: "purple",
                      color: "white",
                      padding: "10px",
                      marginRight: "10px",
                      borderRadius: "6px",
                    }}
                  >
                    Delete Desk
                  </button>
                )}
              </div>
            </div>
            <div
              style={{
                width: "100%",
                padding: "15px",
                marginTop: "0px",
                marginBottom: "auto",
                paddingBottom: "0px",
              }}
            >
              <h2 style={{ fontSize: "16px", fontWeight: "bold" }}>Tools</h2>

              <div style={{ margin: "10px 0" }}>
                <label style={{ color: "white" }}>Grid Opacity: </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={gridOpacity}
                  onChange={(e) => setGridOpacity(parseFloat(e.target.value))}
                />
              </div>

              <div style={{ margin: "10px 0" }}>
                <label style={{ color: "white" }}>Room Opacity: </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={roomOpacity}
                  onChange={(e) => setRoomOpacity(parseFloat(e.target.value))}
                />
              </div>
              <div style={{ margin: "10px 0" }}>
                <label style={{ color: "white" }}>Desk Opacity: </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={deskOpacity}
                  onChange={(e) => setDeskOpacity(parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                height: "50px",
                margin: "15px",
              }}
            >
              <button
                onClick={saveDesks}
                style={{
                  backgroundColor: "darkblue",
                  color: "white",
                  padding: "15px",
                  flex: 1,
                  marginLeft: "5px",
                  borderRadius: "6px",
                }}
              >
                Save
              </button>{" "}
              <button
                onClick={backButton}
                style={{
                  backgroundColor: "darkblue",
                  color: "white",
                  padding: "15px",
                  flex: 1,
                  marginLeft: "5px",
                  borderRadius: "6px",
                }}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDesigner;
