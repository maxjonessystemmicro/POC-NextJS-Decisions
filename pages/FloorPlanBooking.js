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

const FloorPlanBooking = () => {
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

  const [DeskConfigs, setDeskConfigs] = useState(null);
  const [EntityBookings, setEntityBookings] = useState(null);

  const [Creater_Account_ID, setCreater_Account_ID] = useState(
    "01HGDVRVHW8YZ0KESEY6EPA71Q"
  );

  let [RoomIndex, setRoomIndex] = useState(0);
  let [DeskIndex, setDeskIndex] = useState(0);

  const stageRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    //2. url has data, no session storage
    // edit mode, clear url
    if (window.location.search !== null && (window.location.pathname.includes("FloorPlan") && window.location.search.split('&').length > 1)) {
    
      const urlParams = new URLSearchParams(window.location.search);
      const FloorPlans = urlParams.get("FloorPlan");
      const Rooms = urlParams.get("Rooms");
      const Desks = urlParams.get("Desks");

      try {
        const parsedFloorPlan = JSON.parse(FloorPlans);
        const parsedRooms = JSON.parse(Rooms);
        const parsedDesks = JSON.parse(Desks);
     
        setFloorPlan({
          ID: parsedFloorPlan.ID,
          Vertices: parsedFloorPlan.Vertices,
          startShapePosition: parsedFloorPlan.startShapePosition,
          floorName: parsedFloorPlan.FloorPlan_Name,
          floorNumber: parsedFloorPlan.Floor_Number,
        });
     
        setType("manual");
        //console.log("image",parsedFloorPlan.FloorPlan_Image);
        //setImageObj(parsedFloorPlan.FloorPlan_Image);
        setFloorName(parsedFloorPlan.FloorPlan_Name);
        setFloorNumber(parsedFloorPlan.Floor_Number);
        setGridSizeValue(parsedFloorPlan.Grid_Size);
        setPlotHeight(parsedFloorPlan.Grid_Height);
        setPlotWidth(parsedFloorPlan.Grid_Width);
        setImagePosition(parsedFloorPlan.FloorPlan_Image_Position);

        if (parsedRooms) {
          parsedRooms.forEach((room, index) => {
            room.Internal_ID = index;
          });

          setRooms(parsedRooms);

          const newRoomColors = {};
          parsedRooms.forEach((room) => {
            newRoomColors[parseInt(room.Internal_ID)] = getRandomColor();
          });
          setRoomColors(newRoomColors);
        }

        if (parsedDesks) {
          parsedDesks.forEach((desk, index) => {
            desk.Internal_ID = index;
          });
          setDesks(parsedDesks);

          const newDeskColors = {};
          parsedDesks.forEach((desk) => {
            newDeskColors[parseInt(desk.Internal_ID)] = getRandomColor();
          });
          setDeskColors(newDeskColors);
 
        }
       
        //save in session storage
        sessionStorage.setItem(
          "FloorPlan",
          JSON.stringify({
            ID: parsedFloorPlan.ID,
            Vertices: parsedFloorPlan.Vertices,
            startShapePosition: parsedFloorPlan.startShapePosition,
            floorName: parsedFloorPlan.FloorPlan_Name,
            floorNumber: parsedFloorPlan.Floor_Number,
          })
        );
        sessionStorage.setItem("GridSize", parsedFloorPlan.Grid_Size);
        sessionStorage.setItem("GridHeight", parsedFloorPlan.Grid_Height);
        sessionStorage.setItem("GridWidth", parsedFloorPlan.Grid_Width);
        sessionStorage.setItem("rooms", JSON.stringify(parsedRooms));
        sessionStorage.setItem("desks", JSON.stringify(parsedDesks));

        //set the url
        router.replace(
          {
            pathname: router.pathname,
            query: { ...router.query },
          },
          undefined,
          { shallow: true }
        );
      } catch (error) {
        console.log("Data is not JSON or is invalid JSON", error);
      }
    }

    //3. session storage has data, url is empty
    if (
      sessionStorage.getItem("FloorPlan") !== null 
    ) {
      let gridSize = JSON.parse(sessionStorage.getItem("GridSize"));
      let gridHeight = JSON.parse(sessionStorage.getItem("GridHeight"));
      let gridWidth = JSON.parse(sessionStorage.getItem("GridWidth"));
      let floorPlan = JSON.parse(sessionStorage.getItem("FloorPlan"));
      let rooms = JSON.parse(sessionStorage.getItem("rooms"));
      let desks = JSON.parse(sessionStorage.getItem("desks"));

      setFloorPlan(floorPlan);
      setGridSizeValue(gridSize);
      setPlotHeight(gridHeight);
      setPlotWidth(gridWidth);

      if (rooms) {
        rooms.forEach((room, index) => {
          room.Internal_ID = index;
        });

        setRooms(rooms);

        const newRoomColors = {};
        rooms.forEach((room) => {
          newRoomColors[parseInt(room.Internal_ID)] = getRandomColor();
        });
        setRoomColors(newRoomColors);
      }

      if (desks) {
        desks.forEach((desk, index) => {
          desk.Internal_ID = index;
        });
        setDesks(desks);

        const newDeskColors = {};
        desks.forEach((desk) => {
          newDeskColors[parseInt(desk.Internal_ID)] = getRandomColor();
        });
        setDeskColors(newDeskColors);
     
      }
    }
    if(!DeskConfigs){
      fetchConfigurations();
    }
    
  }, []);

  // Snap a value to the nearest grid point
  const snapToGrid = (value) =>
    Math.round(value / gridSizeValue) * gridSizeValue;

  // Navigate back to the previous page
  const backButton = async () => {
    resetFloorPlan();
    window.history.back();
  };

  const fetchConfigurations = async (roomID) => {
  
    if(floorPlan && !DeskConfigs){

      try {
     
        const response = await fetch(`/api/fetchAvailableConfigs?FloorPlanID=${floorPlan.ID}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          }
        });
  
        const responseText = await response.text();
  
        if (!response.ok) {
          throw new Error(
            `Network response was not ok: ${response.status} ${response.statusText}\n${responseText}`
          );
        } else {

          const deskConfigurations = JSON.parse(responseText);
          let tempDeskConfigs = deskConfigurations.Done.Configs;

          if (deskConfigurations.Done.ExistingBookings !== null) {
            deskConfigurations.Done.ExistingBookings.forEach((booking) => {
              tempDeskConfigs.forEach((config) => {
                if (booking.DeskSpaceEntityID === config.ID) {
                  config.ExistingBookings = booking;
                }
              });
            });
          }




          setDeskConfigs(tempDeskConfigs);
          setEntityBookings(deskConfigurations.Done.ExistingBookings);
    
        }
      } catch (error) {
        console.error("Error fetching configurations:", error);
      }
    }
    
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

    if (isDrawingRoom) {
      setCurrentRoom((prevRoom) => {
        if (
          prevRoom.length > 0 &&
          clickedPosition.x === prevRoom[0].x &&
          clickedPosition.y === prevRoom[0].y
        ) {
          const newRoom = {
            id: null,
            FloorPlan_ID: floorPlan.Internal_ID,
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
      const clickedRoom = rooms.find((room) =>
        isPointInPolygon(clickedPosition, room.Vertices)
      );

      setSelectedRoom(clickedRoom || null);
      if (desks) {
        const clickedDesk = desks.find((desk) =>
          isPointInPolygon(clickedPosition, desk.Vertices)
        );
        setSelectedDesk(clickedDesk || null);
      }
    }
  };

  // Reset the floor plan to its initial state
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
    setDeskIndex(0);
    setRoomIndex(0);
    sessionStorage.removeItem("FloorPlan");
    sessionStorage.removeItem("GridSize");
    sessionStorage.removeItem("GridHeight");
    sessionStorage.removeItem("GridWidth");
    sessionStorage.removeItem("ImageData");
    sessionStorage.removeItem("SelectedRoom");
    sessionStorage.removeItem("ImagePosition");
    sessionStorage.removeItem("IsComplete");
    sessionStorage.removeItem("rooms");
    sessionStorage.removeItem("desks");
    // alert("Floor plan data cleared!");
  };


  // Scale the image to fit within the plot dimensions
  const scaleImage = (img) => {
    const scale = Math.min(plotWidth / img.width, plotHeight / img.height);
    return {
      width: img.width * scale,
      height: img.height * scale,
    };
  };

  const calculateAvailability = (Config) => {

  const capacity = Config.Capacity;
  const bookings = Config.ExistingBookings;
  
  const availability = `${bookings ? bookings : 0}/${capacity} Booked`;
  return availability;

  }

  const handleConfigClick  = (Config) => {

    const clickedDesk = desks.find((desk) => desk.ID === Config.DeskID);
    console.log("clickedDesk",clickedDesk);
    setSelectedRoom(clickedDesk.RoomID);
    setSelectedDesk(clickedDesk);
    
  }

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

  // Handle editing of a room

  const handleEditRoom = () => {
    if (selectedRoom) {
      sessionStorage.setItem("SelectedRoom", JSON.stringify(selectedRoom));
      sessionStorage.setItem("FloorPlan", JSON.stringify(floorPlan));
      sessionStorage.setItem("GridSize", gridSizeValue);
      sessionStorage.setItem("GridHeight", plotHeight);
      sessionStorage.setItem("GridWidth", plotWidth);

      sessionStorage.setItem("rooms", JSON.stringify(rooms));
      sessionStorage.setItem("desks", JSON.stringify(desks));

      router.push("/RoomDesigner");
    } else if (selectedDesk) {
      const deskRoom = rooms.find(
        (room) => room.Internal_ID === selectedDesk.Room_ID
      );
      if (deskRoom) {
        sessionStorage.setItem("SelectedRoom", JSON.stringify(deskRoom));
        const roomDesks = desks.filter(
          (desk) => desk.Room_ID === deskRoom.Internal_ID
        );
        sessionStorage.setItem("RoomDesks", JSON.stringify(roomDesks));
      }
    }
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
              flex: "3",
              position: "relative",
              overflow: "hidden",
              backgroundColor: "white",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                border: "3px solid #D6D6D6",
                backgroundColor: "white",
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
                        context.strokeWidth = 4;
                        context.strokeStyle = "blue";

                        context.stroke();
                      }}
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
                  {rooms &&
                    rooms.map((room) => (
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
                  {desks &&
                    desks.map((desk) => (
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
                      fill="green"
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
                  Available Bookings
                </label>
              </div>

              <button
                style={{
                  backgroundColor: "#007bff",
                  color: "white",
                  padding: "10px 20px",
                  margin: "10px 0",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
                onClick={() => fetchConfigurations()}
              >
                Fetch Configurations
              </button>

              {DeskConfigs && (
                <div style={{ marginTop: "20px" }}>
                  {DeskConfigs.map((config, index) => (
                    <div
                      key={index}
                      style={{
                        color:'black',
                        display: "flex",
                        flexDirection:"column",
                        textAlign:"left",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        padding: "10px",
                        backgroundColor: index % 2 === 0 ? "#f2f2f2" : "white",
                        cursor: "pointer",
                      }}
                      onClick={() => handleConfigClick(config)}
                    >
                      <div style={{ flex: 1 }}>{config.Desk_SpaceName}</div>
                      <div style={{ flex: 1 }}>{calculateAvailability(config)}</div>
                    </div>
                  ))}
                </div>
              )}

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
              {/* Grey overlay when disabled */}
              {(!floorPlan || isDrawingRoom || !rooms.length) && (
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
                <label style={{ color: "white" }}>
                  Floor Plan Fill Opacity:{" "}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={floorPlanOpacity}
                  onChange={(e) =>
                    setFloorPlanOpacity(parseFloat(e.target.value))
                  }
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
                {type === "complete" ? "Cancel" : "Back"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorPlanBooking;
