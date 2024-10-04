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

// Dynamically import Konva components to avoid SSR issues
const DynamicStage = dynamic(
  () => import("react-konva").then((mod) => mod.Stage),
  { ssr: false }
);
const DynamicLayer = dynamic(
  () => import("react-konva").then((mod) => mod.Layer),
  { ssr: false }
);

const gridSize = 20;
const PLOT_CONFIG = { width: 50, height: 45 };

const SingleFloorPlan = () => {
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
  let [RoomIndex, setRoomIndex] = useState(1);
  let [DeskIndex, setDeskIndex] = useState(1);
  const stageRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);

      const FloorPlan1 = urlParams.get("FloorPlan");
      const Rooms = urlParams.get("Rooms");
      const Desks = urlParams.get("Desks");

      if (!FloorPlan1) {
        setFloorPlan(null);
        setCustomVertices([]);
        setRooms([]);
        setCurrentRoom([]);
        setSelectedRoom(null);
        setRoomColors({});
        setType("complete");
        setDesks([]);
        setCurrentDesk([]);
        setSelectedDesk(null);

        setDeskColors({});
        setDeskIndex(1);
        setRoomIndex(1);
        sessionStorage.removeItem("FloorPlanData");
        sessionStorage.removeItem("GridSize");
        sessionStorage.removeItem("GridHeight");
        sessionStorage.removeItem("GridWidth");
        sessionStorage.removeItem("ImageData");
        sessionStorage.removeItem("ImagePosition");
        sessionStorage.removeItem("IsComplete");
        sessionStorage.removeItem("Rooms");
        sessionStorage.removeItem("Desks");
      }else{
        setType("comm");
      }

      try {
        const parsedFloorPlan = JSON.parse(FloorPlan1);
        const parsedRooms = JSON.parse(Rooms);
        const parsedDesks = JSON.parse(Desks);


        console.log(parsedDesks);
       

       
        setFloorPlan({
          ID: parsedFloorPlan.ID,
          Vertices: parsedFloorPlan.Vertices,
          startShapePosition: parsedFloorPlan.startShapePosition,
          floorName: parsedFloorPlan.FloorPlan_Name,
          floorNumber: parsedFloorPlan.Floor_Number,
        });
        setFloorName(parsedFloorPlan.FloorPlan_Name);
        setFloorNumber(parsedFloorPlan.Floor_Number);
        setGridSizeValue(20);
        setPlotHeight(parsedFloorPlan.Grid_Height);
        setPlotWidth(parsedFloorPlan.Grid_Width);
        setImagePosition(parsedFloorPlan.FloorPlan_Image_Position);
        setRooms(parsedRooms);

        if(parsedRooms){
          if (parsedRooms.length > 0) {
            parsedRooms.forEach((room, index) => {
              room.Internal_ID = index;
            });
          }
        }

        

        const newRoomColors = {};
        parsedRooms.forEach((room) => {
          newRoomColors[parseInt(room.Internal_ID)] = getRandomColor();
        });
        setRoomColors(newRoomColors);

        if (parsedDesks) {
          setDesks(parsedDesks);
          const newDeskColors = {};
          parsedDesks.forEach((desk) => {
            newDeskColors[parseInt(desk.Internal_ID)] = getRandomColor();
          });
      
            if (parsedDesks.length > 0) {
              parsedDesks.forEach((desk, index) => {
                desk.Internal_ID = index;
              });
            }
          
          setDeskColors(newDeskColors);
        }
      } catch (error) {
        console.log("Data is not JSON or is invalid JSON",error);
      }
    } else {
      console.log("No data parameter found in URL");
    }
  }, []);

  const snapToGrid = (value) =>
    Math.round(value / gridSizeValue) * gridSizeValue;

  const backButton = async () => {
    window.history.back();
  };

  const completeFloor = async () => {
    if (type === "complete") {
      if (desks.length > 0) {
        try {
          const response = await fetch("/api/floorPlanAPI", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              FloorPlan: {
                Internal_ID: 1,
                FloorPlan_Name: floorName,
                Floor_Number: floorNumber,
                Creater_Account_ID: Creater_Account_ID,
                Start_Shape_Position: floorPlan.startShapePosition,
                Vertices: floorPlan.Vertices,
                Grid_Size: gridSizeValue,
                Grid_Height: plotHeight,
                Grid_Width: plotWidth,
                FloorPlan_Image: {
                  Id: "fakeID",
                  FileName: "FakeFileName.png",
                  Contents: "FAKE",
                },
                FloorPlan_Image_Position: imagePosition,
              },
              Rooms: rooms,
              Desks: desks,
            }),
          });

          const responseText = await response.text();

          if (!response.ok) {
            throw new Error(
              `Network response was not ok: ${response.status} ${response.statusText}\n${responseText}`
            );
          }
        } catch (error) {
          console.error("Error creating floor plan:", error);
          alert(
            "An error occurred while completing the floor plan. Please check the console for more details."
          );
        }
      }
    } else {
      if (desks.length > 0) {
        try {
          const response = await fetch("/api/editAPI", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              FloorPlan: {
                Internal_ID: 1,
                ID: floorPlan.ID,
                FloorPlan_Name: floorName,
                Floor_Number: floorNumber,
                Creater_Account_ID: Creater_Account_ID,
                Start_Shape_Position: floorPlan.startShapePosition,
                Vertices: floorPlan.Vertices,
                Grid_Size: gridSizeValue,
                Grid_Height: plotHeight,
                Grid_Width: plotWidth,
                FloorPlan_Image: {
                  Id: "fakeID",
                  FileName: "FakeFileName.png",
                  Contents: "FAKE",
                },
                FloorPlan_Image_Position: imagePosition,
              },
              Rooms: rooms,
              Desks: desks,
            }),
          });

          const responseText = await response.text();

          if (!response.ok) {
            throw new Error(
              `Network response was not ok: ${response.status} ${response.statusText}\n${responseText}`
            );
          }
        } catch (error) {
          console.error("Error creating floor plan:", error);
          alert(
            "An error occurred while completing the floor plan. Please check the console for more details."
          );
        }
      }
    }
  };

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

    if (isDrawingRoom) {
      setCurrentRoom((prevRoom) => {
        if (
          prevRoom.length > 0 &&
          clickedPosition.x === prevRoom[0].x &&
          clickedPosition.y === prevRoom[0].y
        ) {
          const newRoom = {
            id: null,
            floorPlanId: floorPlan.Internal_ID,
            Vertices: prevRoom,
            Internal_ID: RoomIndex,
          };
          setRooms((prevRooms) => [...prevRooms, newRoom]);
          setRoomColors((prevColors) => ({
            ...prevColors,
            [RoomIndex]: getRandomColor(),
          }));

          setRoomIndex(RoomIndex + 1);
          return [];
        }
        return [...prevRoom, clickedPosition];
      });
    } else if (isCustomRoom) {
      setCustomVertices((prevVertices) => {
        if (
          prevVertices.length > 0 &&
          clickedPosition.x === prevVertices[0].x &&
          clickedPosition.y === prevVertices[0].y
        ) {
          const newFloorPlan = {
            id: null,
            Internal_ID: 1,
            Vertices: prevVertices,
            startShapePosition: { x: prevVertices[0].x, y: prevVertices[0].y },
          };
          setFloorPlan(newFloorPlan);
          setCustomVertices([]);
          setIsCustomRoom(false);
        }
        return [...prevVertices, clickedPosition];
      });
    } else if (isAddingDesk) {
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
      // Check if clicked on a room or desk
      const clickedRoom = rooms.find((room) =>
        isPointInPolygon(clickedPosition, room.Vertices)
      );

      setSelectedRoom(clickedRoom || null);

      const clickedDesk = desks.find((desk) =>
        isPointInPolygon(clickedPosition, desk.Vertices)
      );
      setSelectedDesk(clickedDesk || null);
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

  const toggleAddDesk = () => {
    setIsAddingDesk(!isAddingDesk);
    if (isAddingDesk) {
      if (currentDesk.length > 0) {
        const Vertices = squaresToVertices(currentDesk);
        const newDesk = {
          id: null,
          floorPlanId: floorPlan.ID,
          Vertices: Vertices,
          Internal_ID: DeskIndex,
          Room_Id: selectedRoom ? selectedRoom.Internal_ID : null,
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

  // Convert desk squares to Vertices
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

  const saveFloorPlan = () => {
    sessionStorage.setItem("FloorPlanData", JSON.stringify(floorPlan));
    sessionStorage.setItem("GridSize", JSON.stringify(gridSize));
    sessionStorage.setItem("GridHeight", JSON.stringify(plotHeight));
    sessionStorage.setItem("GridWidth", JSON.stringify(plotWidth));
    sessionStorage.setItem("ImagePosition", JSON.stringify(imagePosition));
    sessionStorage.setItem("Rooms", JSON.stringify(rooms));
    sessionStorage.setItem("Desks", JSON.stringify(desks));
    alert("Floor plan saved!");
  };

  const resetFloorPlan = () => {
    setFloorPlan(null);
    setCustomVertices([]);
    setRooms([]);
    setCurrentRoom([]);
    setSelectedRoom(null);
    setRoomColors({});
    setType("complete");
    setDesks([]);
    setCurrentDesk([]);
    setSelectedDesk(null);

    setDeskColors({});
    setDeskIndex(1);
    setRoomIndex(1);
    sessionStorage.removeItem("FloorPlanData");
    sessionStorage.removeItem("GridSize");
    sessionStorage.removeItem("GridHeight");
    sessionStorage.removeItem("GridWidth");
    sessionStorage.removeItem("ImageData");
    sessionStorage.removeItem("ImagePosition");
    sessionStorage.removeItem("IsComplete");
    sessionStorage.removeItem("Rooms");
    sessionStorage.removeItem("Desks");
    alert("Floor plan data cleared!");
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
        sessionStorage.setItem("ImageData", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const scaleImage = (img) => {
    const scale = Math.min(plotWidth / img.width, plotHeight / img.height);
    return {
      width: img.width * scale,
      height: img.height * scale,
    };
  };

  const moveImage = (dx, dy) => {
    setImagePosition((prev) => ({
      x: prev.x + dx * gridSizeValue,
      y: prev.y + dy * gridSizeValue,
    }));
  };

  const handleFloorName = (e) => {
    const newName = e.target.value;
    if (newName) {
      setFloorName(newName);
    }
  };

  const handleFloorNumber = (e) => {
    const newSize = parseInt(e.target.value);
    if (!isNaN(newSize)) {
      setFloorNumber(newSize);
    }
  };

  const handleGridSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    if (!isNaN(newSize)) {
      setGridSizeValue(newSize);
      setPlotHeight((prevHeight) => (prevHeight / gridSizeValue) * newSize);
      setPlotWidth((prevWidth) => (prevWidth / gridSizeValue) * newSize);
    }
  };

  const handleHeightChange = (e) => {
    const newHeight = parseInt(e.target.value);
    if (!isNaN(newHeight)) {
      setPlotHeight(newHeight * gridSizeValue);
    }
  };

  const handleWidthChange = (e) => {
    const newWidth = parseInt(e.target.value);
    if (!isNaN(newWidth)) {
      setPlotWidth(newWidth * gridSizeValue);
    }
  };

  const deleteSelectedRoom = () => {
    if (selectedRoom) {
      setRooms((prevRooms) =>
        prevRooms.filter(
          (room) => room.Internal_ID !== selectedRoom.Internal_ID
        )
      );
      setDesks((prevDesks) =>
        prevDesks.filter((desk) => desk.Room_Id !== selectedRoom.Internal_ID)
      );
      setSelectedRoom(null);
    }
  };

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

  const handleEditRoom = () => {
    if (selectedRoom) {
      sessionStorage.setItem("SelectedRoom", JSON.stringify(selectedRoom));

      const roomDesks = desks.filter(
        (desk) => desk.Room_Id === selectedRoom.Internal_ID
      );
      sessionStorage.setItem("RoomDesks", JSON.stringify(roomDesks));

      router.push("/RoomDesigner");
    } else if (selectedDesk) {
      const deskRoom = rooms.find(
        (room) => room.Internal_ID === selectedDesk.Room_Id
      );
      if (deskRoom) {
        sessionStorage.setItem("SelectedRoom", JSON.stringify(deskRoom));
        const roomDesks = desks.filter(
          (desk) => desk.Room_Id === deskRoom.Internal_ID
        );
        sessionStorage.setItem("RoomDesks", JSON.stringify(roomDesks));
        router.push("/RoomDesigner");
      }
    }
  };

  
  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw" }}>
      <div
        style={{
          flex: "2",
          position: "relative",
          overflow: "hidden",
          backgroundColor: "white",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ border: "5px solid black" }}>
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
              {/* Render grid lines */}
              {Array.from({ length: plotWidth / gridSizeValue }).map((_, i) => (
                <Line
                  key={`vertical-${i}`}
                  points={[i * gridSizeValue, 0, i * gridSizeValue, plotHeight]}
                  stroke="gray"
                  strokeWidth={0.5}
                  opacity={gridOpacity}
                />
              ))}
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
              {/* Render floor plan */}
              {floorPlan && (
                <Shape
                  sceneFunc={(context) => {
                    context.beginPath();
                    floorPlan.Vertices.forEach((vertex, idx) => {
                      idx === 0
                        ? context.moveTo(vertex.x, vertex.y)
                        : context.lineTo(vertex.x, vertex.y);
                    });
                    context.closePath();
                    context.fillStyle = `rgba(173, 216, 230, ${floorPlanOpacity})`;
                    context.fill();
                    context.strokeStyle = "blue";
                    context.stroke();
                  }}
                />
              )}
              {/* Render custom Vertices */}
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
                      points={[
                        vertex.x,
                        vertex.y,
                        customVertices[index + 1].x,
                        customVertices[index + 1].y,
                      ]}
                      stroke="blue"
                      strokeWidth={2}
                    />
                  );
                }
                return null;
              })}
              {/* Render rooms */}
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
              {/* Render current room being drawn */}
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
              {/* Render desks */}
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
              {/* Render current desk being added */}
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

              {/* Render red dot for desk movement */}
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
      {/* Control panel */}
      <div
        style={{
          flex: "1",
          display: "flex",
          flexDirection: "column",
          color: "white",
          margin: 0,
          backgroundColor: "grey",
          height: "100%",
          overflowY: "auto",
          borderLeft: "5px black solid",
        }}
      >
        {/* Selected item info */}
        <div style={{ width: "100%", height: "175px", padding: "15px" }}>
          <div style={{ color: "white" }}>
            <div style={{ margin: "10px 0", marginTop: "0px" }}>
              <label
                style={{ color: "white", fontSize: "20px", fontWeight: "bold" }}
              >
                Floor Plan Designer
              </label>
            </div>
            <div style={{ margin: "10px 0", marginTop: "0px" }}>
              <label style={{ color: "white" }}>Name: </label>
              <input
                value={floorName}
                onChange={handleFloorName}
                style={{ width: "150px", marginLeft: "5px", color: "black" }}
              />
            </div>
            <div style={{ margin: "10px 0" }}>
              <label style={{ color: "white" }}>Floor: </label>
              <input
                type="number"
                value={floorNumber}
                onChange={handleFloorNumber}
                style={{ width: "150px", marginLeft: "10px", color: "black" }}
              />
            </div>

            <h3>Selected Item:</h3>
            {selectedRoom && <p>Room ID: {selectedRoom.Internal_ID}</p>}
            {selectedDesk && <p>Desk ID: {selectedDesk.Internal_ID}</p>}
          </div>
        </div>
        {/* Floor plan design controls */}
        <div
          style={{ width: "100%", backgroundColor: "navy", padding: "15px" }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: "bold" }}>
            Design Layout
          </h2>
          <button
            onClick={toggleCustomRoom}
            style={{
              backgroundColor: "green",
              color: "white",
              padding: "10px",
              marginRight: "10px",
            }}
            disabled={floorPlan || isDrawingRoom || isAddingDesk}
          >
            Draw Floorplan
          </button>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ marginRight: "10px" }}
            disabled={isDrawingRoom || isAddingDesk}
          />
          <div
            style={{ display: "flex", alignItems: "center", margin: "10px 0" }}
          >
            <div style={{ marginRight: "15px" }}>
              <label style={{ color: "white", marginRight: "5px" }}>
                Grid Size:
              </label>
              <input
                type="number"
                value={gridSizeValue}
                onChange={handleGridSizeChange}
                style={{ width: "50px", color: "black" }}
                disabled={isDrawingRoom || isAddingDesk || floorPlan}
              />
            </div>
            <div style={{ marginRight: "15px" }}>
              <label style={{ color: "white", marginRight: "5px" }}>
                Height (ft):
              </label>
              <input
                type="number"
                value={plotHeight / gridSizeValue}
                onChange={handleHeightChange}
                style={{ width: "50px", color: "black" }}
                disabled={isDrawingRoom || isAddingDesk || floorPlan}
              />
            </div>
            <div>
              <label style={{ color: "white", marginRight: "5px" }}>
                Width (ft):
              </label>
              <input
                type="number"
                value={plotWidth / gridSizeValue}
                onChange={handleWidthChange}
                style={{ width: "50px", color: "black" }}
                disabled={isDrawingRoom || isAddingDesk || floorPlan}
              />
            </div>
          </div>
        </div>
        {/* Room design controls */}
        <div style={{ width: "100%", backgroundColor: "red", padding: "15px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: "bold" }}>Design Rooms</h2>
          <button
            onClick={toggleDrawRoom}
            style={{
              backgroundColor: isDrawingRoom ? "darkgreen" : "teal",
              color: "white",
              padding: "10px",
              marginRight: "10px",
            }}
            disabled={!floorPlan || isAddingDesk}
          >
            {isDrawingRoom ? "Stop Drawing Room" : "Draw Room"}
          </button>
          {selectedRoom && (
            <button
              onClick={deleteSelectedRoom}
              style={{
                backgroundColor: "purple",
                color: "white",
                padding: "10px",
                marginRight: "10px",
              }}
            >
              Delete Room
            </button>
          )}
          {(selectedRoom || selectedDesk) && (
            <button
              onClick={handleEditRoom}
              style={{
                backgroundColor: "green",
                color: "white",
                padding: "10px",
                margin: "10px 0",
              }}
            >
              Edit Room
            </button>
          )}
        </div>
        {/* Desk design controls */}
        <div
          style={{ width: "100%", backgroundColor: "purple", padding: "15px" }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: "bold" }}>Design Desks</h2>
          <button
            onClick={toggleAddDesk}
            style={{
              backgroundColor: isAddingDesk ? "darkblue" : "blue",
              color: "white",
              padding: "10px",
              marginRight: "10px",
            }}
            disabled={!floorPlan || isDrawingRoom || !rooms.length}
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
              }}
            >
              Delete Desk
            </button>
          )}
        </div>
        {/* Tools */}
        <div
          style={{
            width: "100%",
            padding: "15px",
            marginTop: "0px",
            marginBottom: "auto",
            paddingBottom: "0px",
          }}
        >
          {/* Image movement controls */}
          <h2 style={{ fontSize: "16px", fontWeight: "bold" }}>Tools</h2>
          <div style={{ margin: "10px 0" }}>
            <label style={{ color: "white" }}>Image Opacity: </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={imageOpacity}
              onChange={(e) => setImageOpacity(parseFloat(e.target.value))}
            />
          </div>
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
            <label style={{ color: "white" }}>Floor Plan Fill Opacity: </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={floorPlanOpacity}
              onChange={(e) => setFloorPlanOpacity(parseFloat(e.target.value))}
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
          <button
            onClick={resetFloorPlan}
            style={{
              backgroundColor: "Orange",
              color: "white",
              padding: "10px",
              marginRight: "10px",
            }}
            disabled={isDrawingRoom || isAddingDesk}
          >
            Reset
          </button>
          <button
            onClick={saveFloorPlan}
            style={{
              backgroundColor: "blue",
              color: "white",
              padding: "10px",
              marginRight: "10px",
            }}
          >
            Save
          </button>

          <button
            onClick={() => moveImage(0, -0.1)}
            style={{
              margin: "5px",
              padding: "10px",
              background: "lightgrey",
              border: "none",
              borderRadius: "5px",
            }}
          >
            ↑
          </button>
          <button
            onClick={() => moveImage(0.1, 0)}
            style={{
              margin: "5px",
              padding: "10px",
              background: "lightgrey",
              border: "none",
              borderRadius: "5px",
            }}
          >
            →
          </button>
          <button
            onClick={() => moveImage(-0.1, 0)}
            style={{
              margin: "5px",
              padding: "10px",
              background: "lightgrey",
              border: "none",
              borderRadius: "5px",
            }}
          >
            ←
          </button>
          <button
            onClick={() => moveImage(0, 0.1)}
            style={{
              margin: "5px",
              padding: "10px",
              background: "lightgrey",
              border: "none",
              borderRadius: "5px",
            }}
          >
            ↓
          </button>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            height: "50px",
            margin: "10px",
          }}
        >
          <button
            onClick={completeFloor}
            style={{
              backgroundColor: "blue",
              color: "white",
              padding: "15px",
              flex: 1,
              marginRight: "5px",
            }}
          >
            {type === "complete" ? "Complete" : "Save"}
          </button>
          <button
            onClick={backButton}
            style={{
              backgroundColor: "blue",
              color: "white",
              padding: "15px",
              flex: 1,
              marginLeft: "5px",
            }}
          >
            {type === "complete" ? "Cancel" : "Back"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SingleFloorPlan;
