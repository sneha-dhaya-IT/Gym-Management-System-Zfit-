"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface IClass {
  _id: string;
  name: string;
  type: string;
  duration: number;
  maxCapacity: number;
  price: number;
  status: string;
  createdAt: string;
}

interface ITrainer {
  _id: string;
  name: string;
  specialty: string;
  status: string;
}

interface IFacility {
  _id: string;
  name: string;
  status: string;
}

interface DataContextType {
  classes: IClass[];
  trainers: ITrainer[];
  facilities: IFacility[];
  refreshData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [classes, setClasses] = useState<IClass[]>([]);
  const [trainers, setTrainers] = useState<ITrainer[]>([]);
  const [facilities, setFacilities] = useState<IFacility[]>([]);

  const fetchData = async () => {
    try {
      const [classRes, trainerRes, facilityRes] = await Promise.all([
        fetch("http://localhost:5000/api/v1/bookings/classes"),
        fetch("http://localhost:5000/api/v1/bookings/trainers"),
        fetch("http://localhost:5000/api/v1/bookings/facilities"),
      ]);

      const [classData, trainerData, facilityData] = await Promise.all([
        classRes.json(),
        trainerRes.json(),
        facilityRes.json(),
      ]);

      if (classData.success) setClasses(classData.data);
      if (trainerData.success) setTrainers(trainerData.data);
      if (facilityData.success) setFacilities(facilityData.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <DataContext.Provider
      value={{ classes, trainers, facilities, refreshData: fetchData }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
};
