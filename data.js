/**
 * NTS Travel Services - Initial Mock Dataset
 * Realistic data models for University Bus Transportation (NUST Corridor)
 *
 * FUTURE BACKEND:
 * In production, this file is replaced by server-side SQL/NoSQL schemas
 * and initial database migration seeds.
 */

export const INITIAL_DEMO_DATA = {
  system: {
    serviceName: "NTS Travel Services",
    institution: "National University of Sciences & Technology (NUST)",
    version: "1.0.0-PROTOTYPE",
    currency: "PKR",
    date: new Date().toISOString().split("T")[0],
    lastSync: new Date().toISOString()
  },

  // 1. Buses (5 buses)
  buses: [
    {
      id: "bus-01",
      number: "NTS-01",
      plateNumber: "LEA-1234",
      capacity: 40,
      assignedDriverId: "drv-01",
      routeId: "route-wah-nust",
      status: "Active", // Active | Inactive | Maintenance
      currentJourneyType: "morning", // morning | return
      currentStopIndex: 1, // At Taxila Chowk
      journeyStatus: "At Stop", // Scheduled | Polling Open | Polling Closed | Trip Started | At Stop | Departed Stop | Completed | Cancelled
      lat: 33.7438,
      lng: 72.8089,
      speed: "0 km/h",
      heading: "SE",
      lastUpdated: "10:42 AM",
      isGpsActive: true
    },
    {
      id: "bus-02",
      number: "NTS-02",
      plateNumber: "ICT-5678",
      capacity: 40,
      assignedDriverId: "drv-02",
      routeId: "route-wah-nust",
      status: "Active",
      currentJourneyType: "morning",
      currentStopIndex: 2, // At Margalla Avenue
      journeyStatus: "Trip Started",
      lat: 33.6938,
      lng: 72.9150,
      speed: "45 km/h",
      heading: "SE",
      lastUpdated: "10:40 AM",
      isGpsActive: true
    },
    {
      id: "bus-03",
      number: "NTS-03",
      plateNumber: "RWP-9012",
      capacity: 45,
      assignedDriverId: "drv-03",
      routeId: "route-isb-nust",
      status: "Active",
      currentJourneyType: "morning",
      currentStopIndex: 0,
      journeyStatus: "Polling Open",
      lat: 33.5950,
      lng: 73.0540,
      speed: "0 km/h",
      heading: "N",
      lastUpdated: "08:15 AM",
      isGpsActive: false
    },
    {
      id: "bus-04",
      number: "NTS-04",
      plateNumber: "LEA-8821",
      capacity: 40,
      assignedDriverId: "drv-04",
      routeId: "route-wah-nust",
      status: "Active",
      currentJourneyType: "morning",
      currentStopIndex: 0,
      journeyStatus: "Scheduled",
      lat: 33.7715,
      lng: 72.7533,
      speed: "0 km/h",
      heading: "E",
      lastUpdated: "07:30 AM",
      isGpsActive: false
    },
    {
      id: "bus-05",
      number: "NTS-05",
      plateNumber: "ICT-3341",
      capacity: 35,
      assignedDriverId: "drv-05",
      routeId: "route-nust-wah",
      status: "Inactive",
      currentJourneyType: "return",
      currentStopIndex: 0,
      journeyStatus: "Scheduled",
      lat: 33.6425,
      lng: 72.9904,
      speed: "0 km/h",
      heading: "NW",
      lastUpdated: "07:00 AM",
      isGpsActive: false
    }
  ],

  // 2. Stops (12 stops along Wah-Taxila-Margalla-NUST corridor)
  stops: [
    {
      id: "stop-wah-barrier3",
      name: "Wah Cantt - Barrier 3",
      location: "G.T. Road, Wah Cantt",
      lat: 33.7715,
      lng: 72.7533,
      routeId: "route-wah-nust",
      sequence: 1,
      isActive: true
    },
    {
      id: "stop-taxila-chowk",
      name: "Taxila Chowk",
      location: "Taxila Flyover Underpass",
      lat: 33.7438,
      lng: 72.8089,
      routeId: "route-wah-nust",
      sequence: 2,
      isActive: true
    },
    {
      id: "stop-taxila-museum",
      name: "Taxila Museum Stop",
      location: "Near Museum Gate",
      lat: 33.7490,
      lng: 72.8250,
      routeId: "route-wah-nust",
      sequence: 3,
      isActive: true
    },
    {
      id: "stop-sangjani-toll",
      name: "Sangjani Toll Plaza",
      location: "G.T. Road / Sangjani",
      lat: 33.6890,
      lng: 72.8710,
      routeId: "route-wah-nust",
      sequence: 4,
      isActive: true
    },
    {
      id: "stop-margalla-entry",
      name: "Margalla Avenue Entry",
      location: "Margalla Bypass Intersection",
      lat: 33.6938,
      lng: 72.9150,
      routeId: "route-wah-nust",
      sequence: 5,
      isActive: true
    },
    {
      id: "stop-b17-gardens",
      name: "Sector B-17 Multi Gardens",
      location: "Main Gate, G.T. Road",
      lat: 33.6750,
      lng: 72.8450,
      routeId: "route-wah-nust",
      sequence: 6,
      isActive: true
    },
    {
      id: "stop-d12-chowk",
      name: "Sector D-12 Chowk",
      location: "Margalla Ave / D-12 Link",
      lat: 33.7120,
      lng: 72.9700,
      routeId: "route-wah-nust",
      sequence: 7,
      isActive: true
    },
    {
      id: "stop-g13-turn",
      name: "Sector G-13 Turn",
      location: "Kashmir Highway link",
      lat: 33.6510,
      lng: 72.9650,
      routeId: "route-wah-nust",
      sequence: 8,
      isActive: true
    },
    {
      id: "stop-nust-gate1",
      name: "NUST Gate 1 (Kashmir Highway)",
      location: "Main Entrance, Sector H-12",
      lat: 33.6425,
      lng: 72.9904,
      routeId: "route-wah-nust",
      sequence: 9,
      isActive: true
    },
    {
      id: "stop-nust-gate2",
      name: "NUST Gate 2 (SEECS/Concordia)",
      location: "Service Road, Sector H-12",
      lat: 33.6480,
      lng: 72.9970,
      routeId: "route-wah-nust",
      sequence: 10,
      isActive: true
    },
    {
      id: "stop-nust-hostels",
      name: "NUST Central Hostels Terminal",
      location: "Central Parking, Sector H-12",
      lat: 33.6450,
      lng: 73.0010,
      routeId: "route-wah-nust",
      sequence: 11,
      isActive: true
    },
    {
      id: "stop-rwp-saddar",
      name: "Rawalpindi Saddar GPO",
      location: "The Mall / Saddar",
      lat: 33.5950,
      lng: 73.0540,
      routeId: "route-isb-nust",
      sequence: 1,
      isActive: true
    }
  ],

  // 3. Routes (Reusable routes)
  routes: [
    {
      id: "route-wah-nust",
      name: "Wah Cantt → NUST H-12",
      origin: "Wah Cantt",
      destination: "NUST Sector H-12",
      estimatedDurationMinutes: 65,
      stopIds: [
        "stop-wah-barrier3",
        "stop-taxila-chowk",
        "stop-margalla-entry",
        "stop-nust-gate1",
        "stop-nust-hostels"
      ]
    },
    {
      id: "route-nust-wah",
      name: "NUST H-12 → Wah Cantt (Return)",
      origin: "NUST Sector H-12",
      destination: "Wah Cantt",
      estimatedDurationMinutes: 65,
      stopIds: [
        "stop-nust-hostels",
        "stop-nust-gate1",
        "stop-margalla-entry",
        "stop-taxila-chowk",
        "stop-wah-barrier3"
      ]
    },
    {
      id: "route-isb-nust",
      name: "Rawalpindi Saddar → NUST H-12",
      origin: "Saddar Rawalpindi",
      destination: "NUST H-12",
      estimatedDurationMinutes: 45,
      stopIds: [
        "stop-rwp-saddar",
        "stop-nust-gate1",
        "stop-nust-hostels"
      ]
    }
  ],

  // 4. Drivers (5 drivers)
  drivers: [
    {
      id: "drv-01",
      driverId: "DRV-01",
      name: "Muhammad Ali",
      phone: "+92 300 5123456",
      assignedBusId: "bus-01",
      status: "Active",
      rating: "4.9"
    },
    {
      id: "drv-02",
      driverId: "DRV-02",
      name: "Tariq Mehmood",
      phone: "+92 301 5234567",
      assignedBusId: "bus-02",
      status: "Active",
      rating: "4.8"
    },
    {
      id: "drv-03",
      driverId: "DRV-03",
      name: "Ghulam Rasool",
      phone: "+92 302 5345678",
      assignedBusId: "bus-03",
      status: "Active",
      rating: "4.7"
    },
    {
      id: "drv-04",
      driverId: "DRV-04",
      name: "Abdul Rehman",
      phone: "+92 303 5456789",
      assignedBusId: "bus-04",
      status: "Active",
      rating: "4.8"
    },
    {
      id: "drv-05",
      driverId: "DRV-05",
      name: "Sajid Khan",
      phone: "+92 304 5567890",
      assignedBusId: "bus-05",
      status: "Inactive",
      rating: "4.6"
    }
  ],

  // 5. Students (20 students)
  students: [
    {
      id: "stu-01",
      studentId: "NUST-2022-CS-101",
      name: "Hamza Malik",
      email: "student@nts.local",
      phone: "+92 333 1112233",
      department: "SEECS - Computer Science",
      registeredDate: "2023-09-01",
      status: "Active"
    },
    {
      id: "stu-02",
      studentId: "NUST-2022-EE-102",
      name: "Ali Raza",
      email: "ali@nts.local",
      phone: "+92 333 2223344",
      department: "SEECS - Electrical Eng",
      registeredDate: "2023-09-02",
      status: "Active"
    },
    {
      id: "stu-03",
      studentId: "NUST-2023-SE-103",
      name: "Ahmed Farooq",
      email: "ahmed@nts.local",
      phone: "+92 333 3334455",
      department: "SEECS - Software Eng",
      registeredDate: "2023-09-05",
      status: "Active"
    },
    {
      id: "stu-04",
      studentId: "NUST-2023-ME-104",
      name: "Usman Tariq",
      email: "usman@nts.local",
      phone: "+92 333 4445566",
      department: "SMME - Mechanical Eng",
      registeredDate: "2023-09-10",
      status: "Active"
    },
    {
      id: "stu-05",
      studentId: "NUST-2021-BBA-105",
      name: "Bilal Hassan",
      email: "bilal@nts.local",
      phone: "+92 333 5556677",
      department: "NBS - Business Admin",
      registeredDate: "2022-09-01",
      status: "Active"
    },
    {
      id: "stu-06",
      studentId: "NUST-2022-CS-106",
      name: "Zainab Fatima",
      email: "zainab@nts.local",
      phone: "+92 333 6667788",
      department: "SEECS - Computer Science",
      registeredDate: "2023-09-03",
      status: "Active"
    },
    {
      id: "stu-07",
      studentId: "NUST-2023-EE-107",
      name: "Ayesha Khan",
      email: "ayesha@nts.local",
      phone: "+92 333 7778899",
      department: "SEECS - Electrical Eng",
      registeredDate: "2023-09-12",
      status: "Active"
    },
    {
      id: "stu-08",
      studentId: "NUST-2024-AI-108",
      name: "Omar Farooq",
      email: "omar@nts.local",
      phone: "+92 333 8889900",
      department: "SEECS - Artificial Intelligence",
      registeredDate: "2024-09-01",
      status: "Active"
    },
    {
      id: "stu-09",
      studentId: "NUST-2022-CE-109",
      name: "Saad Sheikh",
      email: "saad@nts.local",
      phone: "+92 333 9990011",
      department: "NICE - Civil Eng",
      registeredDate: "2023-09-15",
      status: "Active"
    },
    {
      id: "stu-10",
      studentId: "NUST-2023-ARC-110",
      name: "Maryam Noor",
      email: "maryam@nts.local",
      phone: "+92 333 0001122",
      department: "SADA - Architecture",
      registeredDate: "2023-09-20",
      status: "Active"
    },
    {
      id: "stu-11",
      studentId: "NUST-2022-CS-111",
      name: "Hassan Javed",
      email: "hassan@nts.local",
      phone: "+92 334 1122334",
      department: "SEECS - Computer Science",
      registeredDate: "2023-09-04",
      status: "Active"
    },
    {
      id: "stu-12",
      studentId: "NUST-2021-EE-112",
      name: "Farhan Saeed",
      email: "farhan@nts.local",
      phone: "+92 334 2233445",
      department: "SEECS - Electrical Eng",
      registeredDate: "2022-09-05",
      status: "Active"
    },
    {
      id: "stu-13",
      studentId: "NUST-2023-CH-113",
      name: "Sana Mir",
      email: "sana@nts.local",
      phone: "+92 334 3344556",
      department: "SCME - Chemical Eng",
      registeredDate: "2023-09-22",
      status: "Active"
    },
    {
      id: "stu-14",
      studentId: "NUST-2022-ECO-114",
      name: "Kashif Nisar",
      email: "kashif@nts.local",
      phone: "+92 334 4455667",
      department: "S3H - Economics",
      registeredDate: "2023-09-18",
      status: "Active"
    },
    {
      id: "stu-15",
      studentId: "NUST-2023-DS-115",
      name: "Hira Khalid",
      email: "hira@nts.local",
      phone: "+92 334 5566778",
      department: "SEECS - Data Science",
      registeredDate: "2023-09-11",
      status: "Active"
    },
    {
      id: "stu-16",
      studentId: "NUST-2022-ME-116",
      name: "Danish Aziz",
      email: "danish@nts.local",
      phone: "+92 334 6677889",
      department: "SMME - Mechanical Eng",
      registeredDate: "2023-09-14",
      status: "Active"
    },
    {
      id: "stu-17",
      studentId: "NUST-2024-SE-117",
      name: "Mahnoor Baig",
      email: "mahnoor@nts.local",
      phone: "+92 334 7788990",
      department: "SEECS - Software Eng",
      registeredDate: "2024-09-02",
      status: "Active"
    },
    {
      id: "stu-18",
      studentId: "NUST-2023-CE-118",
      name: "Waqas Qureshi",
      email: "waqas@nts.local",
      phone: "+92 334 8899001",
      department: "NICE - Civil Eng",
      registeredDate: "2023-09-16",
      status: "Active"
    },
    {
      id: "stu-19",
      studentId: "NUST-2022-BIO-119",
      name: "Nimra Siddiqui",
      email: "nimra@nts.local",
      phone: "+92 334 9900112",
      department: "ASAB - Biotechnology",
      registeredDate: "2023-09-19",
      status: "Active"
    },
    {
      id: "stu-20",
      studentId: "NUST-2021-MS-120",
      name: "Mustafa Kamal",
      email: "mustafa@nts.local",
      phone: "+92 334 0011223",
      department: "SCME - Materials Science",
      registeredDate: "2022-09-10",
      status: "Active"
    }
  ],

  // 6. Polling Configuration (Morning & Return)
  polls: {
    morning: {
      id: "poll-morning-today",
      type: "morning",
      title: "Going to University (Morning Journey)",
      date: new Date().toISOString().split("T")[0],
      startTime: "06:00 AM",
      endTime: "08:00 AM",
      status: "Open", // Open | Closed
      allowOverflow: false
    },
    return: {
      id: "poll-return-today",
      type: "return",
      title: "Returning from University (Evening Journey)",
      date: new Date().toISOString().split("T")[0],
      startTime: "02:00 PM",
      endTime: "05:00 PM",
      status: "Open",
      allowOverflow: false
    }
  },

  // 7. Student Votes (Initial seed with the exact scenario from prompt)
  votes: [
    // Morning votes for Bus 01
    {
      id: "vote-01",
      studentId: "stu-01", // Hamza
      busId: "bus-01",
      stopId: "stop-taxila-chowk",
      journeyType: "morning",
      timestamp: "07:05 AM"
    },
    {
      id: "vote-02",
      studentId: "stu-02", // Ali
      busId: "bus-01",
      stopId: "stop-taxila-chowk",
      journeyType: "morning",
      timestamp: "07:08 AM"
    },
    {
      id: "vote-03",
      studentId: "stu-03", // Ahmed
      busId: "bus-01",
      stopId: "stop-taxila-chowk",
      journeyType: "morning",
      timestamp: "07:10 AM"
    },
    {
      id: "vote-04",
      studentId: "stu-04", // Usman
      busId: "bus-01",
      stopId: "stop-taxila-chowk",
      journeyType: "morning",
      timestamp: "07:12 AM"
    },
    {
      id: "vote-05",
      studentId: "stu-05", // Bilal
      busId: "bus-01",
      stopId: "stop-wah-barrier3",
      journeyType: "morning",
      timestamp: "06:45 AM"
    },
    {
      id: "vote-06",
      studentId: "stu-06", // Zainab
      busId: "bus-01",
      stopId: "stop-margalla-entry",
      journeyType: "morning",
      timestamp: "07:15 AM"
    },
    {
      id: "vote-07",
      studentId: "stu-07", // Ayesha
      busId: "bus-01",
      stopId: "stop-wah-barrier3",
      journeyType: "morning",
      timestamp: "06:50 AM"
    },
    // Bus 02 votes
    {
      id: "vote-08",
      studentId: "stu-08",
      busId: "bus-02",
      stopId: "stop-margalla-entry",
      journeyType: "morning",
      timestamp: "07:18 AM"
    },
    {
      id: "vote-09",
      studentId: "stu-09",
      busId: "bus-02",
      stopId: "stop-b17-gardens",
      journeyType: "morning",
      timestamp: "07:20 AM"
    },
    {
      id: "vote-10",
      studentId: "stu-10",
      busId: "bus-02",
      stopId: "stop-d12-chowk",
      journeyType: "morning",
      timestamp: "07:22 AM"
    },
    // Return votes
    {
      id: "vote-ret-01",
      studentId: "stu-01", // Hamza
      busId: "bus-01",
      stopId: "stop-taxila-chowk",
      journeyType: "return",
      timestamp: "08:30 AM"
    },
    {
      id: "vote-ret-02",
      studentId: "stu-02",
      busId: "bus-01",
      stopId: "stop-taxila-chowk",
      journeyType: "return",
      timestamp: "08:40 AM"
    }
  ],

  // 8. Boarding Records (Exact stop states from prompt Section 7 & 8)
  boardingRecords: [
    {
      id: "rec-01",
      studentId: "stu-02", // Ali
      busId: "bus-01",
      stopId: "stop-taxila-chowk",
      journeyType: "morning",
      status: "Boarded", // Waiting | Boarded | Not Boarded | Missed Bus
      updatedAt: "10:41 AM",
      markedBy: "student" // student | driver | system
    },
    {
      id: "rec-02",
      studentId: "stu-03", // Ahmed
      busId: "bus-01",
      stopId: "stop-taxila-chowk",
      journeyType: "morning",
      status: "Boarded",
      updatedAt: "10:42 AM",
      markedBy: "student"
    },
    {
      id: "rec-03",
      studentId: "stu-01", // Hamza
      busId: "bus-01",
      stopId: "stop-taxila-chowk",
      journeyType: "morning",
      status: "Missed Bus",
      updatedAt: "10:40 AM",
      markedBy: "student",
      reason: "Could not reach stop in time"
    },
    {
      id: "rec-04",
      studentId: "stu-04", // Usman
      busId: "bus-01",
      stopId: "stop-taxila-chowk",
      journeyType: "morning",
      status: "Waiting",
      updatedAt: "10:35 AM",
      markedBy: "system"
    },
    // Wah Cantt boarded students (earlier stop)
    {
      id: "rec-05",
      studentId: "stu-05",
      busId: "bus-01",
      stopId: "stop-wah-barrier3",
      journeyType: "morning",
      status: "Boarded",
      updatedAt: "10:15 AM",
      markedBy: "driver"
    },
    {
      id: "rec-06",
      studentId: "stu-07",
      busId: "bus-01",
      stopId: "stop-wah-barrier3",
      journeyType: "morning",
      status: "Boarded",
      updatedAt: "10:18 AM",
      markedBy: "student"
    }
  ],

  // 9. Initial Notifications Log
  notifications: [
    {
      id: "notif-01",
      userId: "stu-01",
      title: "Bus Reached Your Stop",
      message: "Your NTS bus (NTS-01) has reached Taxila Chowk. Please confirm boarding immediately.",
      type: "arrival",
      timestamp: "10:40 AM",
      isRead: false,
      actions: ["BOARD", "MISSED"]
    },
    {
      id: "notif-02",
      userId: "stu-04",
      title: "Bus Reached Your Stop",
      message: "Your NTS bus (NTS-01) has reached Taxila Chowk. Driver is waiting.",
      type: "arrival",
      timestamp: "10:40 AM",
      isRead: false,
      actions: ["BOARD", "MISSED"]
    },
    {
      id: "notif-03",
      userId: "all",
      title: "Morning Poll Active",
      message: "Morning polls for university journey are open until 08:00 AM.",
      type: "announcement",
      timestamp: "06:00 AM",
      isRead: true
    }
  ]
};
