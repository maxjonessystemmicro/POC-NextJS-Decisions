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
  const [selectedOpenInterval, setselectedOpenInterval] = useState(null);
  const [selectedCloseInterval, setselectedCloseInterval] = useState(null);

  const [selectedDesk, setSelectedDesk] = useState(null);
  const [selectedDeskConfig, setSelectedDeskConfig] = useState(null);
  const [deskColors, setDeskColors] = useState({});
  const [isDraggingDesk, setIsDraggingDesk] = useState(false);
  const [deskOffset, setDeskOffset] = useState({ x: 0, y: 0 });
  const [tempDeskPosition, setTempDeskPosition] = useState(null);

  const [OLDJson, setOLDJson] = useState(null);
  const [EligibleCreate, setEligibleCreate] = useState(true);
  const [DeskConfigs, setDeskConfigs] = useState(null);
  const [Bookings, setBookings] = useState(null);
  const [TIME_INTERVALS, setTIME_INTERVALS] = useState(null);

  const [updatedDesksFromJSON, setupdatedDesksFromJSON] = useState(null);

  const [Creater_Account_ID, setCreater_Account_ID] = useState(null);

  let [RoomIndex, setRoomIndex] = useState(0);
  let [DeskIndex, setDeskIndex] = useState(0);

  const [Opening_Time, setOpening_Time] = useState(null);
  const [Closing_Time, setClosing_Time] = useState(null);

  const stageRef = useRef(null);
  const router = useRouter();

  // Define statuses
  const STATUS = {
    AVAILABLE: "available",
    BOOKED: "booked",
    PARTIAL: "partial",
  };

  //booking availability conversion

  function findTimeIntervalIndex(timeString, TIME_INTERVALS) {
    return TIME_INTERVALS.findIndex((interval) => interval === timeString);
  }

  function convertToInterval(date, Opening_Time, TIME_INTERVALS) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const intervalIndex =
      (hours - parseInt(Opening_Time.split(":")[0])) * 2 +
      (minutes >= 30 ? 1 : 0);
    return TIME_INTERVALS[intervalIndex];
  }

  function processBooking(
    availability,
    startTime,
    endTime,
    Opening_Time,
    TIME_INTERVALS
  ) {
    const start = new Date(startTime);
    const end = new Date(endTime);

    const startInterval = convertToInterval(
      start,
      Opening_Time,
      TIME_INTERVALS
    );
    const endInterval = convertToInterval(end, Opening_Time, TIME_INTERVALS);

    const startIdx = findTimeIntervalIndex(startInterval, TIME_INTERVALS);
    const endIdx = findTimeIntervalIndex(endInterval, TIME_INTERVALS);

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
  function initializeDeskAvailability(capacity, TIME_INTERVALS) {
    let availability = {};
    TIME_INTERVALS.forEach((time) => {
      availability[time] = {
        Status: "available",
        SpaceLeft: capacity,
      };
    });
    return availability;
  }

  function parseDeskData(deskData, TIME_INTERVALS) {
    return deskData.map((desk) => ({
      deskName: desk.Desk_SpaceName,
      deskId: desk.DeskID,
      //remainingCapacity: Number(desk.Capacity),
      availability: initializeDeskAvailability(desk.Capacity, TIME_INTERVALS),
    }));
  }

  //function that takes the bookings payload and updates all the desks

  function updateDeskAvailability(
    deskConfigs,
    bookings,
    Opening_Time,
    TIME_INTERVALS
  ) {
    bookings.forEach((booking) => {
      const desk = deskConfigs.find(
        (config) => booking.DeskID === config.deskId
      );

      if (desk) {
        const newAvailability = processBooking(
          desk.availability,
          booking.StartTime,
          booking.EndTime,
          Opening_Time,
          TIME_INTERVALS
        );

        desk.availability = newAvailability;
      }
    });

    return deskConfigs;
  }

  // using sample data to generate the schedule

  const SetupData = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const FloorPlans = urlParams.get("FloorPlan");
    const Rooms = urlParams.get("Rooms");
    const Desks = urlParams.get("Desks");
    const Creater_Account_ID = urlParams.get("CAI");
    const Bookings = urlParams.get("Bookings");
    const Configs = urlParams.get("Configs");

    if (Creater_Account_ID) {
      sessionStorage.setItem("CAI", Creater_Account_ID);
    }

    if (FloorPlans) {
      try {
        const parsedFloorPlan = JSON.parse(FloorPlans);
        const parsedRooms = JSON.parse(Rooms);
        const parsedDesks = JSON.parse(Desks);

        let openingTime = parsedFloorPlan.Opening_Time.split("T")[1].slice(
          0,
          5
        );
        let closingTime = parsedFloorPlan.Closing_Time.split("T")[1].slice(
          0,
          5
        );

        setOpening_Time(openingTime);
        setClosing_Time(closingTime);

        let TIME_INTERVALSCOPY = Array.from({ length: 48 }, (_, index) => {
          const hours = String(Math.floor(index / 2)).padStart(2, "0");
          const minutes = index % 2 === 0 ? "00" : "30";
          const time = `${hours}:${minutes}`;
          return time >= openingTime && time <= closingTime ? time : null;
        }).filter(Boolean);

        setTIME_INTERVALS(TIME_INTERVALSCOPY);

        const fetchConfigurations = async (
          floorPlan,
          openingTime,
          closingTime,
          TIME_INTERVALS
        ) => {
          if (floorPlan && TIME_INTERVALS) {
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

                  let tempDeskConfigsNew = parseDeskData(
                    deskConfigurations.Done.Configs,
                    TIME_INTERVALS
                  );

                  let updatedDesksFromJSON = updateDeskAvailability(
                    tempDeskConfigsNew,
                    deskConfigurations.Done.ExistingBookings
                      ? deskConfigurations.Done.ExistingBookings
                      : [],
                    openingTime,
                    TIME_INTERVALS
                  );

                  setupdatedDesksFromJSON(updatedDesksFromJSON);

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
                // router.replace(
                //   {
                //     pathname: router.pathname,
                //     query: { ...router.query },
                //   },
                //   undefined,
                //   { shallow: true }
                // );
              }
            } catch (error) {
              console.error("Error fetching configurations:", error);
            }
          }
        };

        fetchConfigurations(
          parsedFloorPlan,
          openingTime,
          closingTime,
          TIME_INTERVALSCOPY
        );
      } catch (error) {
        console.log("Data is not JSON or is invalid JSON", error);
      }
    }
  };

  useEffect(() => {
    SetupData();
  }, []);

  // Snap a value to the nearest grid point
  const snapToGrid = (value) =>
    Math.round(value / gridSizeValue) * gridSizeValue;

  const bookEntity = async () => {
    if (Creater_Account_ID) {
      try {
        let selectedCellsObj = selectedCells.sort((a, b) =>
          a.interval.localeCompare(b.interval)
        );

        const response = await fetch("/api/newBookingEntity", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            FloorPlanID: floorPlan.ID,
            StartTime: new Date(
              new Date().setHours(
                ...selectedCellsObj[0].interval.split(":").map(Number),
                0,
                0
              )
            ).toLocaleString(),
            EndTime: new Date(
              new Date().setHours(
                ...selectedCellsObj[selectedCellsObj.length - 1].interval
                  .split(":")
                  .map(Number),
                0,
                0
              )
            ).toLocaleString(),
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
          setSelectedCells([]);
          setSelectedDesk(null);
          setSelectedDeskConfig(null);
          setupdatedDesksFromJSON(null);
          setDeskConfigs(null);
          setBookings(null);

          setOLDJson(null);

          SetupData();
        }
      } catch (error) {
        console.error("Error booking entity:", error);
      }
    }
  };

  // Add new onChange handler for time intervals
  const handleTimeIntervalChange = (event, type) => {
    if (type == "opening") {
      const selectedInterval = event.target.value;
      // Update state and notify parent component
      setselectedOpenInterval(selectedInterval);
      setOpening_Time(selectedInterval);
    } else {
      const selectedInterval = event.target.value;
      // Update state and notify parent component
      setselectedCloseInterval(selectedInterval);
      setselectedCloseInterval(selectedInterval);
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
      if (clickedRoom) {
        if (OLDJson == null) {
          console.log("1");
          setOLDJson(updatedDesksFromJSON);

          let filteredDesks = updatedDesksFromJSON?.filter(
            (fakeDesk) =>
              desks.find((desk) => desk.ID === fakeDesk.deskId).Room_ID ==
              clickedRoom.ID
          );
          console.log(filteredDesks);
          setupdatedDesksFromJSON(filteredDesks);
        } else {
          console.log("2");
          let filteredDesks = OLDJson?.filter(
            (fakeDesk) =>
              desks.find((desk) => desk.ID === fakeDesk.deskId).Room_ID ==
              clickedRoom.ID
          );
          setupdatedDesksFromJSON(filteredDesks);
        }
      } else {
        if (OLDJson) {
          setupdatedDesksFromJSON(OLDJson);
          setSelectedDesk(null);
          setSelectedDeskConfig(null);
        }
      }

      //setupdatedDesksFromJSON
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

  // Scale the image to fit within the plot dimensions
  const scaleImage = (img) => {
    const scale = Math.min(plotWidth / img.width, plotHeight / img.height);
    return {
      width: img.width * scale,
      height: img.height * scale,
    };
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

  //console.log(TIME_INTERVALS);

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
    const isAlreadySelected = selectedCells.filter(
      (item) =>
        item.DeskID == desk.deskId &&
        item.interval == interval &&
        item.slot == slot
    );

    if (isAlreadySelected?.length > 0) {
      let filtered = selectedCells.filter(
        (item) => item !== isAlreadySelected[0]
      );
      setSelectedCells(filtered);
    } else {
      setSelectedDesk(desks.find((d) => d.ID === desk.deskId));
      setSelectedDeskConfig(
        DeskConfigs.find((config) => config.DeskID === desk.deskId) || null
      );
      setSelectedCells((prevSelected) => {
        return [...prevSelected, { DeskID: desk.deskId, interval, slot }];
      });
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#d4d4d4",
        padding: "15px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "row", height: "100%" }}>
        <div style={{ flex: 1 }}>
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
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                position: "absolute",
                bottom: 25,
                left: 25,
                maxHeight: "35px",
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
                    onChange={(e) => setGridOpacity(parseFloat(e.target.value))}
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
                <div>
                  <label>Room Opacity: </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={roomOpacity}
                    onChange={(e) => setRoomOpacity(parseFloat(e.target.value))}
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
                    onChange={(e) => setDeskOpacity(parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                position: "absolute",
                top: 30,
                left: 30,
                maxHeight: "35px",
              }}
            >
              {Closing_Time && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "15px",
                  }}
                >
                  <select
                    disabled
                    onChange={(e) => handleTimeIntervalChange(e, "opening")}
                    style={{
                      padding: "8px 5px 8px 5px",
                      border: "1px solid #ccc",
                      borderRadius: "5px",
                      width: "250px",
                    }}
                    defaultValue={Opening_Time}
                  >
                    {TIME_INTERVALS?.map((interval, index) => (
                      <option key={index} value={interval}>
                        {interval}
                      </option>
                    ))}
                  </select>
                  <select
                    disabled
                    onChange={(e) => handleTimeIntervalChange(e, "closing")}
                    style={{
                      padding: "8px 5px 8px 5px",
                      border: "1px solid #ccc",
                      borderRadius: "5px",
                      width: "250px",
                    }}
                    defaultValue={Closing_Time}
                  >
                    {TIME_INTERVALS?.map((interval, index) => (
                      <option key={index} value={interval}>
                        {interval}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
                              context.fillStyle =
                                desk.Internal_ID === selectedDesk?.Internal_ID
                                  ? "#689cf7" // Blue hex for selected desk
                                  : "#FFFFFF"; // White background for all desks
                              context.globalAlpha = deskOpacity;
                              context.fill();
                              context.strokeStyle = "black"; // Grey border for all desks
                              context.lineWidth = 1.5;
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
                              context.arc(
                                centerX,
                                centerY,
                                7.5,
                                0,
                                2 * Math.PI
                              );

                              let bookingsCount = 0;
                              if (DeskConfigs) {
                                let bookings = Bookings?.filter(
                                  (booking) => booking.DeskID === desk.ID
                                );
                                bookingsCount = bookings ? bookings.length : 0;
                              }

                              context.fillStyle =
                                bookingsCount > 0 ? "orange" : "green";
                              context.globalAlpha = deskOpacity;
                              context.fill();
                              context.strokeStyle = "black";
                              context.lineWidth = 1;
                              context.stroke();
                              context.font = "12px Arial";
                              context.fillStyle =
                                bookingsCount > 0 ? "black" : "white";
                              context.globalAlpha = deskOpacity;
                              context.textAlign = "center";
                              context.textBaseline = "middle";

                              context.fillText(
                                bookingsCount.toString(),
                                centerX - 0.5,
                                centerY + 1
                              ); // Adjusted to correct the text position
                            }}
                          />
                        </>
                      ))}
                  </DynamicLayer>
                </DynamicStage>
              </div>
            </div>
          </div>
        </div>
        <div style={{ width: "22vw" }}>
          <div
            style={{
              height: "100%",
              width: "100%",

              display: "flex",
              gap: "15px",
              flexDirection: "column",
            }}
          >
            <div style={{ height: "200px" }}>
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "white",
                  padding: "15px",
                  borderRadius: "15px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <h2 style={{ fontWeight: "bolder" }}>Current Bookings</h2>
                <ul style={{ flexGrow: 1, overflowY: "scroll" }}>
                  {Bookings?.sort(
                    (a, b) => new Date(a.StartTime) - new Date(b.StartTime)
                  ).map((booking) => {
                    const deskSpaceName =
                      DeskConfigs.find(
                        (config) => config.DeskID === booking.DeskID
                      )?.Desk_SpaceName || "Unknown";
                    const isHighlighted =
                      booking.AccountID === Creater_Account_ID;
                    return (
                      <li
                        key={booking.ID}
                        style={{
                          fontWeight: isHighlighted ? "none" : "none",
                        }}
                      >
                        {deskSpaceName} -{" "}
                        {new Date(booking.StartTime)
                          .getHours()
                          .toString()
                          .padStart(2, "0") +
                          ":" +
                          new Date(booking.StartTime)
                            .getMinutes()
                            .toString()
                            .padStart(2, "0")}{" "}
                        -{" "}
                        {new Date(
                          new Date(booking.EndTime).setMinutes(
                            new Date(booking.EndTime).getMinutes() + 30
                          )
                        )
                          .getHours()
                          .toString()
                          .padStart(2, "0") +
                          ":" +
                          new Date(
                            new Date(booking.EndTime).setMinutes(
                              new Date(booking.EndTime).getMinutes() + 30
                            )
                          )
                            .getMinutes()
                            .toString()
                            .padStart(2, "0")}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            <div
              className={styles.visualizerContainer}
              style={{ flexGrow: "1" }}
            >
              <table className={styles.visualizerTable}>
                <thead>
                  <tr>
                    <th style={{ width: "50px" }}>Desk</th>
                    {updatedDesksFromJSON?.map((deskFake, index) => (
                      <th
                        style={
                          selectedDeskConfig?.DeskID === deskFake.deskId
                            ? { backgroundColor: "lightblue" }
                            : {}
                        }
                        key={deskFake.deskId}
                        onClick={() => {
                          const selectedDesk = desks.find(
                            (desk) => desk.ID === deskFake.deskId
                          );

                          setSelectedDesk(selectedDesk);
                          setSelectedDeskConfig(
                            DeskConfigs.find(
                              (config) => config.DeskID === deskFake.deskId
                            ) || null
                          );
                        }}
                      >
                        {index + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {updatedDesksFromJSON &&
                    TIME_INTERVALS?.map((interval) => (
                      <tr key={interval}>
                        <td>{interval}</td>
                        {updatedDesksFromJSON.map((desk) => {
                          const slot = desk.availability[interval];

                          let status =
                            desk.availability[interval]?.Status || "available";

                          let outcome = selectedCells?.filter(
                            (cell) =>
                              cell.DeskID === desk.deskId &&
                              cell.slot === slot &&
                              cell.interval === interval
                          );
                          if (outcome.length > 0) {
                            status = "selected";
                          }
                          return (
                            <td
                              key={`${desk.deskId}-${interval}`}
                              className={`${styles[`statusCell${status}`]} ${
                                selectedCells?.filter(
                                  (cell) => cell.DeskID === desk.deskId
                                )
                                  ? styles.selected
                                  : ""
                              }`}
                              style={
                                selectedDeskConfig?.DeskID === desk.deskId
                                  ? { opacity: 0.75 }
                                  : {}
                              }
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
            <div
              style={{
                backgroundColor: "white",
                height: "175px",
                padding: "15px",
                borderRadius: "15px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  textAlign: "left",
                }}
              >
                <div style={{ Width: "50%" }}>
                  <p>
                    <strong>Desk Details</strong>
                  </p>
                  <p>
                    <strong>Name:</strong>{" "}
                    {selectedDeskConfig?.Desk_SpaceName
                      ? selectedDeskConfig.Desk_SpaceName
                      : ""}
                  </p>
                  <p>
                    <strong>Type:</strong>{" "}
                    {selectedDeskConfig?.Type ? selectedDeskConfig.Type : ""}
                  </p>
                  <p>
                    <strong>Capacity:</strong>{" "}
                    {selectedDeskConfig?.Capacity
                      ? selectedDeskConfig.Capacity
                      : ""}
                  </p>
                </div>
                {AvailableAmenties && (
                  <div style={{ width: "50%" }}>
                    <p>
                      <strong>Amenities:</strong>
                      <div style={{ display: "flex", flexWrap: "wrap" }}>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                          }}
                        >
                          {selectedDeskConfig?.Amenities.map((amenityId) => (
                            <div key={amenityId} style={{ width: "100%" }}>
                              •{" "}
                              {AvailableAmenties?.find(
                                (amenity) => amenity.ID === amenityId
                              ).Name
                                ? AvailableAmenties.find(
                                    (amenity) => amenity.ID === amenityId
                                  ).Name
                                : "N/A"}
                            </div>
                          ))}
                        </div>
                      </div>
                    </p>
                  </div>
                )}
              </div>

              <button
                className={styles.confirmButton}
                style={{ width: "100%" }}
                onClick={bookEntity}
                disabled={
                  !selectedCells.every(
                    (cell) => cell.DeskID === selectedCells[0].DeskID
                  )
                }
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloorPlanBooking;
