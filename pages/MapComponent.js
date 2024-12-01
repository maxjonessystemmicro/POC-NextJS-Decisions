import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import styles from "./DeskBookingVisualizer.module.css"; // For custom styling
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
  const [AvailableAmenties, setAvailableAmenties] = useState(null);
  const [imageObj, setImageObj] = useState(null);
  const [imageOpacity, setImageOpacity] = useState(1);
  const [gridOpacity, setGridOpacity] = useState(0.5);
  const [floorPlanOpacity, setFloorPlanOpacity] = useState(0.3);
  const [roomOpacity, setRoomOpacity] = useState(0.5);
  const [deskOpacity, setDeskOpacity] = useState(0.75);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomColors, setRoomColors] = useState({});
  const [isAddingDesk, setIsAddingDesk] = useState(false);
  const [currentDesk, setCurrentDesk] = useState([]);
  const [desks, setDesks] = useState([]);
  const [type, setType] = useState(null);

  const [selectedDesk, setSelectedDesk] = useState(null);
  const [selectedDeskConfig, setSelectedDeskConfig] = useState(null);
  const [deskColors, setDeskColors] = useState({});
  const [isDraggingDesk, setIsDraggingDesk] = useState(false);
  const [deskOffset, setDeskOffset] = useState({ x: 0, y: 0 });
  const [tempDeskPosition, setTempDeskPosition] = useState(null);

  const [DeskConfigs, setDeskConfigs] = useState(null);
  const [Bookings, setBookings] = useState(null);

  const [updatedDesksFromJSON, setupdatedDesksFromJSON] = useState(null);

  const [Creater_Account_ID, setCreater_Account_ID] = useState(null);

  let [RoomIndex, setRoomIndex] = useState(0);
  let [DeskIndex, setDeskIndex] = useState(0);

  const stageRef = useRef(null);
  const router = useRouter();
  // Define the constants for time intervals
  let TIME_INTERVALS = Array.from({ length: 48 }, (_, index) => {
    const hours = String(Math.floor(index / 2)).padStart(2, "0");
    const minutes = index % 2 === 0 ? "00" : "30";
    return `${hours}:${minutes}`;
  });

  // Define statuses
  const STATUS = {
    AVAILABLE: "available",
    BOOKED: "booked",
    PARTIAL: "partial",
  };

  //booking availability conversion

  function findTimeIntervalIndex(timeString) {
    return TIME_INTERVALS.findIndex((interval) => interval === timeString);
  }

  function convertToInterval(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const intervalIndex = hours * 2 + (minutes >= 30 ? 1 : 0);
    return TIME_INTERVALS[intervalIndex];
  }

  function processBooking(availability, startTime, endTime) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const startInterval = convertToInterval(start);
    const endInterval = convertToInterval(end);

    const startIdx = findTimeIntervalIndex(startInterval);
    const endIdx = findTimeIntervalIndex(endInterval);
   
    for (let i = startIdx; i <= endIdx; i++) {
      const interval = TIME_INTERVALS[i];

  
      if (availability[interval].SpaceLeft > 0) {
        availability[interval].SpaceLeft -= 1;

        // Update status based on remaining space
        if (availability[interval].SpaceLeft === 0) {
          availability[interval].Status = STATUS.BOOKED;
        } else {
          availability[interval].Status = STATUS.PARTIAL;
        }
      
      }
    }
    return availability;
  }

  // Utility function to initialize desk availability with all slots as "available"
  function initializeDeskAvailability(capacity) {
    let availability = {};
    TIME_INTERVALS.forEach((time) => {
      availability[time] = {
        Status: "available",
        SpaceLeft: capacity,
      };
    });
    return availability;
  }

  function parseDeskData(deskData) {

    return deskData.map((desk) => ({
      deskName: desk.Desk_SpaceName,
      deskId: desk.DeskID,
      //remainingCapacity: Number(desk.Capacity),
      availability: initializeDeskAvailability(desk.Capacity),
    }));
  }

  //function that takes the bookings payload and updates all the desks

  function updateDeskAvailability(deskConfigs, bookings) {


    bookings.forEach((booking) => {
      const desk = deskConfigs.find(
        (config) => booking.DeskID === config.deskId
      );
    
      if (desk) {
  
        const newAvailability = processBooking(
          desk.availability,
          booking.StartTime,
          booking.EndTime
        );
     
        desk.availability = newAvailability;

 
      }
    });

    return deskConfigs;
  }

  // using sample data to generate the schedule

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const FloorPlans = urlParams.get("FloorPlan");
    const Rooms = urlParams.get("Rooms");
    const Desks = urlParams.get("Desks");
    const Creater_Account_ID = urlParams.get("CAI");
    const Bookings = urlParams.get("Bookings");
    const Configs = urlParams.get("Configs");
   
    TIME_INTERVALS = Array.from({ length: 48 }, (_, index) => {
      const hours = String(Math.floor(index / 2)).padStart(2, "0");
      const minutes = index % 2 === 0 ? "00" : "30";
      return `${hours}:${minutes}`;
    });
  
    
    if(Creater_Account_ID){
      sessionStorage.setItem("CAI", Creater_Account_ID);
    }
   
    if (FloorPlans) {
      try {
        const parsedFloorPlan = JSON.parse(FloorPlans);
        const parsedRooms = JSON.parse(Rooms);
        const parsedDesks = JSON.parse(Desks);

        const fetchConfigurations = async (floorPlan) => {
          if (floorPlan) {
            try {
              const response = await fetch(
                `/api/fetchAvailableConfigs?FloorPlanID=${floorPlan.ID}`,
                {
                  method: "GET",
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );

              const responseText = await response.text();

              if (!response.ok) {
                throw new Error(
                  `Network response was not ok: ${response.status} ${response.statusText}\n${responseText}`
                );
              } else {
                const deskConfigurations = JSON.parse(responseText);
                if (deskConfigurations.Done.Configs) {
                  let tempDeskConfigs = deskConfigurations.Done.Configs.map(
                    (config) => {
                      let existingBooking = null;
                      if (deskConfigurations.Done.ExistingBookings) {
                        existingBooking =
                          deskConfigurations.Done.ExistingBookings.find(
                            (booking) => booking.DeskSpaceEntityID === config.ID
                          );
                      }

                      return existingBooking
                        ? { ...config, ExistingBookings: [existingBooking] }
                        : config;
                    }
                  );
                  setDeskConfigs(tempDeskConfigs);
                  setBookings(deskConfigurations.Done.ExistingBookings);
    
                  let tempDeskConfigsNew = parseDeskData(deskConfigurations.Done.Configs);
         
                
                  if(updatedDesksFromJSON == null){
                    let updatedDesksFromJSON = updateDeskAvailability(
                      tempDeskConfigsNew,
                      deskConfigurations.Done.ExistingBookings ? deskConfigurations.Done.ExistingBookings : []
                    );
                    setupdatedDesksFromJSON(updatedDesksFromJSON);
  
                  }
                 
                  if (deskConfigurations.Done.ExistingBookings) {

              
                  


                    parsedDesks.forEach((desk) => {
                      const booking =
                        deskConfigurations.Done.ExistingBookings.find(
                          (booking) => booking.DeskID === desk.ID
                        );

                      if (booking) {
                        desk.color = "#FF0000";
                        const config = tempDeskConfigs.find(
                          (config) => config.DeskID === desk.ID
                        );
                        if (
                          config &&
                          config.ExistingBookings &&
                          config.ExistingBookings.length < config.Capacity
                        ) {
                          desk.color = "#FFA500"; // Orange color
                        }
                      }
                    });
                  }
                  if (deskConfigurations.Done.Amenties) {
                    setAvailableAmenties(deskConfigurations.Done.Amenties);
                  }
                }

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
                setCreater_Account_ID(Creater_Account_ID);

                if (parsedRooms) {
                  parsedRooms.forEach((room, index) => {
                    room.Internal_ID = index;
                  });

                  setRooms(parsedRooms);

                  const newRoomColors = {};
                  parsedRooms.forEach((room) => {
                    newRoomColors[parseInt(room.Internal_ID)] =
                      getRandomColor();
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
                    newDeskColors[parseInt(desk.Internal_ID)] = desk.color
                      ? desk.color
                      : "#ffffff";
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
                sessionStorage.setItem(
                  "GridHeight",
                  parsedFloorPlan.Grid_Height
                );
                sessionStorage.setItem("GridWidth", parsedFloorPlan.Grid_Width);
                sessionStorage.setItem("rooms", JSON.stringify(parsedRooms));
                sessionStorage.setItem("desks", JSON.stringify(parsedDesks));
                sessionStorage.setItem("CAI", Creater_Account_ID);

                //set the url
                router.replace(
                  {
                    pathname: router.pathname,
                    query: { ...router.query },
                  },
                  undefined,
                  { shallow: true }
                );
              }
            } catch (error) {
              console.error("Error fetching configurations:", error);
            }
          }
        };

        fetchConfigurations(parsedFloorPlan);
      } catch (error) {
        console.log("Data is not JSON or is invalid JSON", error);
      }
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

  const bookEntity = async () => {
    try {


      let selectedCellsObj = selectedCells.sort((a, b) => a.interval.localeCompare(b.interval));



      const response = await fetch("/api/newBookingEntity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          FloorPlanID: floorPlan.ID,
          StartTime: new Date(new Date().setHours(...selectedCellsObj[0].interval.split(':').map(Number), 0, 0)).toLocaleString(),
          EndTime: new Date(new Date().setHours(...selectedCellsObj[selectedCellsObj.length - 1].interval.split(':').map(Number), 0, 0)).toLocaleString(),
          DeskSpaceEntityID: selectedDeskConfig.ID,
          guest: true, // Added guest parameter as per API documentation
          outputtype: "Json", // Added outputtype parameter as per API documentation
          DeskID: selectedDeskConfig.DeskID,
          AccountID: Creater_Account_ID,
        }),
      });

      const responseText = await response.text();
      if (!response.ok) {
        throw new Error(
          `Network response was not ok: ${response.status} ${response.statusText}\n${responseText}`
        );
      } else {
        //convert response text to floorplan object
        const responseFloorPlan = JSON.parse(responseText);

      }
    } catch (error) {
      console.error("Error booking entity:", error);
    }
  };

  // Pick a random color from 5 predefined colors
  const getRandomColor = () => {
    const predefinedColors = [
      "#D3D3D3",
      "#E5E5EA",
      "#F0F0F0",
      "#F5F5DC",
      "#FFFFFF",
    ];
    return predefinedColors[
      Math.floor(Math.random() * predefinedColors.length)
    ];
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
        if (DeskConfigs && clickedDesk) {
          setSelectedDeskConfig(
            DeskConfigs.find((config) => config.DeskID === clickedDesk.ID) ||
              null
          );
        }
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
    let bookings = Config.ExistingBookings;
    if (bookings) {
      bookings = [Config.ExistingBookings];
    }

    const availability = `${bookings ? bookings.length : 0}/${capacity} Booked`;
    return availability;
  };

  const handleConfigClick = (Config) => {
    const clickedDesk = desks.find((desk) => desk.ID === Config.DeskID);

    setSelectedRoom(clickedDesk.RoomID);
    setSelectedDesk(clickedDesk);
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

  const [tooltip, setTooltip] = useState({
    show: false,
    x: 0,
    y: 0,
    content: "",
  });
  const [selectedCells, setSelectedCells] = useState([]);

 

  const handleMouseLeave = () => {
    setTooltip({ show: false, x: 0, y: 0, content: "" });
  };

  const handleCellClick = (interval, slot, desk) => {
   
    const isAlreadySelected = selectedCells.filter((item) => item.DeskID == desk.deskId && item.interval == interval && item.slot == slot);


    if(isAlreadySelected?.length> 0 ){
      let filtered = selectedCells.filter((item) => item !== isAlreadySelected[0]);
      setSelectedCells(filtered);
    }else{
      setSelectedDesk(desk);
      setSelectedDeskConfig(
        DeskConfigs.find((config) => config.DeskID === desk.deskId) ||
          null
      );
      setSelectedCells((prevSelected) => {
        return [...prevSelected, {DeskID:desk.deskId,interval,slot}];
      
    });
    }
   
  };

  const handleConfirmBooking = () => {
   

  
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#d4d4d4",
        padding: "50px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          height: "100%",

          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "auto",
            marginRight: "15px",
            gap: "15px",
            padding: "25px",
            backgroundColor: "white",
            border: "3px solid black",
            height: "100%",
          }}
        >
          <div
            style={{
              border: "3px solid #a6a4a4",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              height: "100%",
            }}
          >
            <div style={{ padding: "15px" }}>
              <h2 style={{ marginBottom: "10px", fontWeight: "bold" }}>
                Filters & Tools
              </h2>
              <div
                style={{
                  width: "100%",

                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  color: "black",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <label>Grid Opacity: </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={gridOpacity}
                        onChange={(e) =>
                          setGridOpacity(parseFloat(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label>Floor Plan Fill Opacity: </label>
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
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <label>Room Opacity: </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={roomOpacity}
                        onChange={(e) =>
                          setRoomOpacity(parseFloat(e.target.value))
                        }
                      />
                    </div>
                    <div>
                      <label>Desk Opacity: </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={deskOpacity}
                        onChange={(e) =>
                          setDeskOpacity(parseFloat(e.target.value))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                border: "3px solid #a6a4a4",

                backgroundColor: "white",
              }}
            >
              <DynamicStage
                width={plotWidth}
                height={plotHeight}
                onMouseDown={handleStageClick}
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
                        context.strokeStyle = "black";

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
                      fill="black"
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
                          stroke="black"
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
                          context.strokeStyle = "black";
                          context.stroke();
                        }}
                      />
                    ))}

                  {desks &&
                    desks.map((desk) => (
                      <>
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
                            // Add green outer shadow glow if desk has no color field
                            if (!desk.color) {
                              context.shadowColor = "green";
                              context.shadowBlur = 2;
                              context.shadowOffsetX = 0;
                              context.shadowOffsetY = 0;
                            }
                            context.fillStyle =
                              desk.Internal_ID === selectedDesk?.Internal_ID
                                ? "#689cf7" // Blue hex
                                : desk.color
                                ? `${desk.color}${Math.round(deskOpacity * 255)
                                    .toString(16)
                                    .padStart(2, "0")}`
                                : `${deskColors[desk.Internal_ID]}${Math.round(
                                    deskOpacity * 255
                                  )
                                    .toString(16)
                                    .padStart(2, "0")}`;
                            context.globalAlpha = deskOpacity;
                            context.fill();
                            context.strokeStyle =
                              desk.Internal_ID === selectedDesk?.Internal_ID
                                ? "black"
                                : "black";
                            context.stroke();
                          }}
                          onClick={() => setSelectedDesk(desk)}
                        />
                        <Shape
                          sceneFunc={(context) => {
                            const centerX =
                              desk.Vertices[0].x + gridSizeValue / 2;
                            const centerY =
                              desk.Vertices[0].y + gridSizeValue / 2;
                            context.beginPath();
                            context.arc(centerX, centerY, 7.5, 0, 2 * Math.PI);
                            context.fillStyle = "white";
                            context.globalAlpha = deskOpacity;
                            context.fill();
                            context.strokeStyle = "black";
                            context.lineWidth = 1;
                            context.stroke();
                            context.font = "12px Arial";
                            context.fillStyle = "black";
                            context.globalAlpha = deskOpacity;
                            context.textAlign = "center";
                            context.textBaseline = "middle";

                            if (DeskConfigs) {
                              let capacityText = parseInt(
                                DeskConfigs.find(
                                  (config) => config.DeskID === desk.ID
                                )?.Capacity
                              );

                              let bookings = Bookings?.filter(
                                (booking) => booking.DeskID === desk.ID
                              );
                              if (bookings) {
                                capacityText -= bookings.length;
                              }

                              context.fillText(
                                capacityText ? capacityText : "0",
                                centerX - 0.5,
                                centerY + 1
                              ); // Adjusted to correct the text position
                            }
                          }}
                        />
                      </>
                    ))}
                </DynamicLayer>
              </DynamicStage>
            </div>
          </div>
        </div>

        <div
          style={{
            border: "3px solid black",
            backgroundColor: "white",
            width: "100%",
            minWidth: "300px",
            padding: "15px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            maxWidth: "550px",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: "#cfcccc",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              borderRadius: "10px",
            }}
          >
            <div
              style={{
                height: "30%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#f0f0f0", // Added background color
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <h2
                  style={{
                    color: "var(--text-color)",
                    textAlign: "center",
                    fontFamily: "var(--tile-header-text)",
                    marginBottom: "5px",
                    marginTop: "5px",
                  }}
                >
                  Floor Plan Availability & Selected Desk
                </h2>
                {selectedDesk && DeskConfigs && selectedDeskConfig && (
                  <div
                    style={{
                      padding: "10px",
                      backgroundColor: "#ffffff", // Added background color
                      borderRadius: "5px",
                      marginTop: "10px", // Added margin top for vertical stacking
                    }}
                  >
                    <p>
                      <strong>Desk Details</strong>
                    </p>
                    <p>
                      <strong>Name:</strong> {selectedDeskConfig.Desk_SpaceName}
                    </p>
                    <p>
                      <strong>Type:</strong> {selectedDeskConfig.Type}
                    </p>
                    <p>
                      <strong>Availability:</strong>{" "}
                      {calculateAvailability(selectedDeskConfig)}
                    </p>
                    <p>
                      <div>
                        <strong>Amenities:</strong>
                        <ul>
                          {selectedDeskConfig.Amenities.map((amenityId) => (
                            <li key={amenityId}>
                              •{" "}
                              {
                                AvailableAmenties.find(
                                  (amenity) => amenity.ID === amenityId
                                ).Name
                              }
                            </li>
                          ))}
                        </ul>
                      </div>
                    </p>
                  </div>
                )}
              </div>
            </div>
            <button
              className={styles.confirmButton}
              onClick={bookEntity}
            >
              Confirm Booking
            </button>
            <div
              style={{
                height: "70%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#e0e0e0", // Added background color
              }}
            >
              
              <div className={styles.visualizerContainer}>
                {tooltip.show && (
                  <div
                    className={styles.tooltip}
                    style={{
                      top: `${tooltip.y}px`,
                      left: `${tooltip.x}px`,
                    }}
                  >
                    {tooltip.content}
                  </div>
                )}
                <table className={styles.visualizerTable}>
                  <thead>
                    <tr>
                      <th style={{ width: "50px" }}>Desk</th>
                      {updatedDesksFromJSON?.map((desk) => (
                        <th style={selectedDeskConfig?.DeskID == desk.deskId ? {backgroundColor:'lightblue'} : {}} key={desk.deskName}>{desk.deskName}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {updatedDesksFromJSON && TIME_INTERVALS.map((interval) => (
                      <tr key={interval}>
                        <td>{interval}</td>
                        {updatedDesksFromJSON.map((desk) => {
                          const slot = desk.availability[interval];
                        
                          let status =
                            desk.availability[interval]?.Status || "available";
                          
                          let outcome = selectedCells?.filter(
                            (cell) => (cell.DeskID === desk.deskId && cell.slot == slot && cell.interval == interval)
                          )
                          if (outcome.length > 0){
                            status= 'selected';
                          }
                          return (
                            <td
                              key={desk.deskName}
                              className={`${styles[`statusCell${status}`]} ${
                                selectedCells?.filter(
                                  (cell) => cell.DeskID === desk.ID
                                )
                                  ? styles.selected
                                  : ""
                              }`}
                              style={selectedDeskConfig?.DeskID == desk.deskId ? {border:'lightblue'} : {}}
                     
                              onMouseLeave={handleMouseLeave}
                              onClick={() =>
                                handleCellClick(interval, slot, desk)
                              }
                            >
                              {slot?.Status === STATUS.PARTIAL
                                ? `${slot.SpaceLeft}`
                                : ""}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                  
                </table>
                   
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorPlanBooking;
