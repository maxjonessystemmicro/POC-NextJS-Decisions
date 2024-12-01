import React, { useState } from "react";
import styles from "./DeskBookingVisualizer.module.css"; // For custom styling

// Define the constants for time intervals
const TIME_INTERVALS = Array.from({ length: 48 }, (_, index) => {
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

// Sample data structure for desks and bookings
const deskBookings = [
  {
    deskName: "Cybertheque Pod 1",
    availability: {
      "00:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "00:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "01:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "01:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "02:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "02:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "03:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "03:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "04:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "04:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "05:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "05:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "06:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "06:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "07:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "07:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "08:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "08:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "09:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "09:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "10:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "10:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "11:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "11:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "12:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "12:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "13:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "13:30": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "14:00": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "14:30": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "15:00": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "15:30": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "16:00": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "16:30": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "17:00": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "17:30": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "18:00": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "18:30": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "19:00": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "19:30": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "20:00": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "20:30": { status: STATUS.PARTIAL, spaceLeft: 4 },
      "21:00": { status: STATUS.PARTIAL, spaceLeft: 4 },
      "21:30": { status: STATUS.PARTIAL, spaceLeft: 4 },
      "22:00": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "22:30": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "23:00": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "23:30": { status: STATUS.AVAILABLE, spaceLeft: 5 },
    },
  },
  {
    deskName: "Cybertheque Pod 2",
    remainingCapacity: 5,
    availability: {
      "00:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "00:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "01:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "01:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "02:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "02:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "03:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "03:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "04:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "04:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "05:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "05:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "06:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "06:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "07:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "07:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "08:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "08:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "09:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "09:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "10:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "10:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "11:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "11:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "12:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "12:30": { status: STATUS.BOOKED, spaceLeft: 0 },
      "13:00": { status: STATUS.BOOKED, spaceLeft: 0 },
      "13:30": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "14:00": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "14:30": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "15:00": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "15:30": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "16:00": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "16:30": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "17:00": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "17:30": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "18:00": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "18:30": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "19:00": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "19:30": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "20:00": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "20:30": { status: STATUS.PARTIAL, spaceLeft: 4 },
      "21:00": { status: STATUS.PARTIAL, spaceLeft: 4 },
      "21:30": { status: STATUS.PARTIAL, spaceLeft: 4 },
      "22:00": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "22:30": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "23:00": { status: STATUS.AVAILABLE, spaceLeft: 5 },
      "23:30": { status: STATUS.AVAILABLE, spaceLeft: 5 },
    },
  },
];

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
  console.log("start interval id: %i", startIdx);
  console.log("end interval id: %i", endIdx);

  for (let i = startIdx; i <= endIdx; i++) {
    const interval = TIME_INTERVALS[i];

    //Decrease SpaceLeft by 1 if there are seats available
    console.log("original availability: %i", availability[interval].SpaceLeft);
    if (availability[interval].SpaceLeft > 0) {
      availability[interval].SpaceLeft -= 1;

      // Update status based on remaining space
      if (availability[interval].SpaceLeft === 0) {
        availability[interval].Status = STATUS.BOOKED;
      } else {
        availability[interval].Status = STATUS.PARTIAL;
      }
      console.log("new availability: %i", availability[interval].SpaceLeft);
      console.log("new status: %s", String(availability[interval].Status));
    }
  }
  return availability;
}

// Utility function to initialize desk availability with all slots as "available"
function initializeDeskAvailability(capacity) {
  const availability = {};
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
    availability: initializeDeskAvailability(Number(desk.Capacity)),
  }));
}

// Example of initializing a desk with default availability
const newDesk = {
  deskName: "Cybertheque Pod 3",
  availability: initializeDeskAvailability(),
};

// Add this new desk to the deskBookings array
deskBookings.push(newDesk);

//function that takes the bookings payload and updates all the desks

function updateDeskAvailability(deskBookings, bookings) {
  function findDeskById(deskId) {
    return deskBookings.find((desk) => desk.deskId === deskId);
  }

  bookings.forEach((booking) => {
    const desk = findDeskById(booking.DeskID);
    if (desk) {
      const newAvailability = processBooking(
        desk.availability,
        booking.StartTime,
        booking.EndTime
      );
      desk.availability = newAvailability;
    }
  });
  return deskBookings;
}

// using sample data to generate the schedule

const desksJSON = `[
  {
      \"ID\": \"01JBAE7X0953QDAAQC78NAZE48\",
      \"Amenities\": [
          \"01JBCN7673JPG60891GSD06K6T\",
          \"01JBCN6KZ8NWMX1Y5RPGEXPKZN\",
          \"01JBCN374VV1C44JX7M8BN6Y96\"
      ],
      \"Status\": null,
      \"Capacity\": 2,
      \"DeskID\": \"01J9Y611XM5SRNV7Z54RCM9NFJ\",
      \"Type\": \"single\",
      \"Desk_SpaceName\": \"max2\",
      \"RoomID\": \"01J9Y2FV3Y9ZGPRAZVQSVVWC67\",
      \"FloorPlanID\": \"01J9Y2FV3GYWY58XEZPZ96HBBQ\",
      \"Hidden\": false,
      \"AdministratorViewOnly\": false,
      \"EntityFolderID\": \"01J8648HKCNGT1TN5VXK2Q7Y0X\",
      \"HistoryFolderID\": null,
      \"AllTagsData\": \"\",
      \"EntityName\": \"max\",
      \"EntityDescription\": null,
      \"State\": null,
      \"CreatedOnDate\": \"2024-10-28T20:49:21.93\",
      \"ModifiedDate\": \"2024-10-29T18:38:05.283\",
      \"CreatedBy\": \"GUEST\",
      \"ModifiedBy\": \"GUEST\",
      \"Archived\": false,
      \"ArchivedBy\": null,
      \"ArchivedDate\": \"1753-01-01T00:00:00\",
      \"Deleted\": false,
      \"DeletedBy\": null,
      \"DeletedOn\": \"1753-01-01T00:00:00\"
  },
  {
      \"ID\": \"01JBAEWJFTQ9E3MFZ0WS4NAHAS\",
      \"Amenities\": [
          \"01JBCN5T3GTCZFHVDKWAAXQGNR\"
      ],
      \"Status\": null,
      \"Capacity\": 6,
      \"DeskID\": \"01J9Y611Y3160CPTPKSTJ6SG04\",
      \"Type\": \"k\",
      \"Desk_SpaceName\": \"avery\",
      \"RoomID\": \"01J9Y2FV3Y9ZGPRAZVQSVVWC67\",
      \"FloorPlanID\": \"01J9Y2FV3GYWY58XEZPZ96HBBQ\",
      \"Hidden\": false,
      \"AdministratorViewOnly\": false,
      \"EntityFolderID\": \"01J8648HKCNGT1TN5VXK2Q7Y0X\",
      \"HistoryFolderID\": null,
      \"AllTagsData\": \"\",
      \"EntityName\": \"avery-10/28/2024 9:00:39 PM\",
      \"EntityDescription\": null,
      \"State\": null,
      \"CreatedOnDate\": \"2024-10-28T21:00:39.29\",
      \"ModifiedDate\": \"2024-11-05T19:05:22.417\",
      \"CreatedBy\": \"GUEST\",
      \"ModifiedBy\": \"GUEST\",
      \"Archived\": false,
      \"ArchivedBy\": null,
      \"ArchivedDate\": \"1753-01-01T00:00:00\",
      \"Deleted\": false,
      \"DeletedBy\": null,
      \"DeletedOn\": \"1753-01-01T00:00:00\"
  },
  {
      \"ID\": \"01JBCRP3B5DPA3R0NV8C1VDP8Y\",
      \"Amenities\": [],
      \"Status\": null,
      \"Capacity\": 5,
      \"DeskID\": \"01J9Y611XVQ72KBRW2KV9MAAZA\",
      \"Type\": \"test\",
      \"Desk_SpaceName\": \"test\",
      \"RoomID\": \"01J9Y2FV3Y9ZGPRAZVQSVVWC67\",
      \"FloorPlanID\": \"01J9Y2FV3GYWY58XEZPZ96HBBQ\",
      \"Hidden\": false,
      \"AdministratorViewOnly\": false,
      \"EntityFolderID\": \"01J8648HKCNGT1TN5VXK2Q7Y0X\",
      \"HistoryFolderID\": null,
      \"AllTagsData\": \"\",
      \"EntityName\": \"test-10/29/2024 6:30:21 PM\",
      \"EntityDescription\": null,
      \"State\": null,
      \"CreatedOnDate\": \"2024-10-29T18:30:21.797\",
      \"ModifiedDate\": \"2024-11-05T19:04:17.703\",
      \"CreatedBy\": \"GUEST\",
      \"ModifiedBy\": \"GUEST\",
      \"Archived\": false,
      \"ArchivedBy\": null,
      \"ArchivedDate\": \"1753-01-01T00:00:00\",
      \"Deleted\": false,
      \"DeletedBy\": null,
      \"DeletedOn\": \"1753-01-01T00:00:00\"
  }
]`;

const bookingsJSON = `[
    {
        \"ID\": \"01JCGM62S1T65P1YPV1F3HFF4H\",
        \"RoomID\": \"01J9Y2FV3Y9ZGPRAZVQSVVWC67\",
        \"FloorPlanID\": \"01J9Y2FV3GYWY58XEZPZ96HBBQ\",
        \"DeskID\": \"01J9Y611XM5SRNV7Z54RCM9NFJ\",
        \"EndTime\": \"2024-11-12T18:44:33.447\",
        \"StartTime\": \"2024-11-12T12:44:33.447\",
        \"DeskSpaceEntityID\": \"01JBAE7X0953QDAAQC78NAZE48\",
        \"AccountID\": null,
        \"Hidden\": false,
        \"AdministratorViewOnly\": false,
        \"EntityFolderID\": \"01J864DK0QZXFJY7M4PKR2XC01\",
        \"HistoryFolderID\": null,
        \"AllTagsData\": null,
        \"EntityName\": \"01J9Y2FV3GYWY58XEZPZ96HBBQmax211/12/2024 4:44:33 PM\",
        \"EntityDescription\": null,
        \"State\": null,
        \"CreatedOnDate\": \"2024-11-12T16:44:22.177\",
        \"ModifiedDate\": \"2024-11-12T16:44:22.177\",
        \"CreatedBy\": \"GUEST\",
        \"ModifiedBy\": \"GUEST\",
        \"Archived\": false,
        \"ArchivedBy\": null,
        \"ArchivedDate\": \"1753-01-01T00:00:00\",
        \"Deleted\": false,
        \"DeletedBy\": null,
        \"DeletedOn\": \"1753-01-01T00:00:00\"
    }
]`;

const parsedDesks = parseDeskData(JSON.parse(desksJSON));
const updatedDesksFromJSON = updateDeskAvailability(
  parsedDesks,
  JSON.parse(bookingsJSON)
);

const newlyupdatedDesksFromJSON = updatedDesksFromJSON;

const DeskBookingVisualizer = () => {
  const [tooltip, setTooltip] = useState({
    show: false,
    x: 0,
    y: 0,
    content: "",
  });
  const [selectedCells, setSelectedCells] = useState([]);

  const handleMouseEnter = (e, content) => {
    const rect = e.target.getBoundingClientRect();
    setTooltip({
      show: true,
      x: rect.x + rect.width / 2,
      y: rect.y - 10,
      content,
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, x: 0, y: 0, content: "" });
  };

  const handleCellClick = (interval, slot, desk) => {
    const content = slot
      ? //? `${interval}: ${slot.Status} - ${slot.SpaceLeft} seats left`
        `${desk.deskId}?${desk.deskName}?${interval}?${slot.Status}?${slot.SpaceLeft}` //`${interval}: ${slot.Status} - ${slot.SpaceLeft} seats left`
      : "No Data";

    setSelectedCells((prevSelected) => {
      const [deskId, deskName, intervalStartTime, deskStatus, seatsLeft] =
        cellContent.split("?");
      if (deskStatus === "booked") {
        return;
      }
      const isAlreadySelected = prevSelected.includes(content);

      if (isAlreadySelected) {
        return prevSelected.filter((item) => item !== content);
      } else {
        return [...prevSelected, content];
      }
    });
  };

  const handleConfirmBooking = () => {
    const bookingData = selectedCells.map((cellContent) => {
      // Find the desk and interval data for the selected cell
      /*
      const selectedDesk = updatedDesksFromJSON.find((desk) =>
        desk.slots.some((slot) => {
          const interval = slot.interval;
          const slotContent = slot.data
            ? `${interval}: ${slot.data.Status.toUpperCase()} - ${slot.data.SpaceLeft} seats left`
            : 'No Data';
          return slotContent === cellContent;
        })
      );
      */

      // If a matching desk is found, extract the data for the JSON structure
      if (true) {
        //new code
        //new code end
        const [deskId, deskName, intervalStartTime, deskStatus, seatsLeft] =
          cellContent.split("?");

        return {
          ID: "2134rfwsefrdgbver456t",
          RoomID: "Room_ID_Placeholder", // Add the corresponding RoomID if available
          FloorPlanID: "FloorPlan_ID_Placeholder", // Add the corresponding FloorPlanID if available
          DeskID: deskId, // Use the correct deskId here
          EndTime: "", // Adjust date and time
          StartTime: new Date(
            `2024-11-12T${intervalStartTime.trim()}`
          ).toISOString(), // Adjust date and time
          DeskSpaceEntityID: "DeskSpaceEntity_ID_Placeholder", // Add if applicable
          AccountID: null,
          Hidden: false,
          AdministratorViewOnly: false,
          EntityFolderID: "EntityFolder_ID_Placeholder",
          HistoryFolderID: null,
          AllTagsData: null,
          EntityName: null,
          EntityDescription: null,
          State: null,
          CreatedOnDate: new Date().toISOString(),
          ModifiedDate: new Date().toISOString(),
          CreatedBy: "GUEST",
          ModifiedBy: "GUEST",
          Archived: false,
          ArchivedBy: null,
          ArchivedDate: "1753-01-01T00:00:00",
          Deleted: false,
          DeletedBy: null,
          DeletedOn: "1753-01-01T00:00:00",
        };
      }

      return null; // Fallback if no match is found
    });

    console.log(
      "Booking Data:",
      JSON.stringify(bookingData.filter(Boolean), null, 2)
    );
  };

  return (
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
            <th style={{width:'50px'}}>Desk</th>
            {updatedDesksFromJSON.map((desk) => (
              <th key={desk.deskName}>{desk.deskName}</th>
            ))}
          
          </tr>
        </thead>
        <tbody>
          {TIME_INTERVALS.map((interval) => (
            <tr key={interval}>
              <td>{interval}</td>
              {updatedDesksFromJSON.map((desk) => {
                const slot = desk.availability[interval];
                const content = slot
                  ? `${interval}: ${slot.Status} - ${slot.SpaceLeft} seats left`
                  : "No Data";
                const status =
                  desk.availability[interval]?.Status || "available";
                return (
                  <td
                    key={desk.deskName}
                    className={`${styles[`statusCell${status}`]} ${
                      selectedCells.includes(content) ? styles.selected : ""
                    }`}
                    onMouseEnter={(e) => handleMouseEnter(e, content)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleCellClick(interval, slot, desk)}
                  >
                    {slot?.Status === STATUS.PARTIAL ? `${slot.SpaceLeft}` : ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.selectedCellsContainer}>
        <h3>Selected Cells:</h3>
        {selectedCells.length > 0 ? (
          <>
            <ul>
              {selectedCells.map((cellContent, index) => {
                const [
                  deskId,
                  deskName,
                  intervalStartTime,
                  deskStatus,
                  seatsLeft,
                ] = cellContent.split("?");
                return (
                  <li
                    key={index}
                  >{`Desk ${deskName} selected for : ${intervalStartTime}`}</li>
                );
              })}
            </ul>
            <button
              className={styles.confirmButton}
              onClick={handleConfirmBooking}
            >
              Confirm Booking
            </button>
          </>
        ) : (
          <p>No cells selected.</p>
        )}
      </div>
    </div>
  );
};

export default DeskBookingVisualizer;
