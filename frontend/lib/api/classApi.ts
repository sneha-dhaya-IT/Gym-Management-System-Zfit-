export interface IClass {
  _id: string;
  name: string;
  type: string;
  duration: number;
  maxCapacity: number;
  price: number;
  status: string;
  createdAt: string;
}

// Fetch all classes
export const fetchClasses = async (): Promise<IClass[]> => {
  const res = await fetch("http://localhost:5000/api/v1/bookings/classes");
  if (!res.ok) throw new Error("Failed to fetch classes");
  const data = await res.json();
  return data.data;
};

// Add a new class
export const addClass = async (cls: Partial<IClass>): Promise<IClass> => {
  const res = await fetch("http://localhost:5000/api/v1/bookings/classes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cls),
  });
  if (!res.ok) throw new Error("Failed to add class");
  const data = await res.json();
  return data.data;
};

// Update class
export const updateClass = async (id: string, cls: Partial<IClass>): Promise<IClass> => {
  const res = await fetch(`http://localhost:5000/api/v1/bookings/classes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cls),
  });
  if (!res.ok) throw new Error("Failed to update class");
  const data = await res.json();
  return data.data;
};

// Delete class
export const deleteClass = async (id: string): Promise<void> => {
  const res = await fetch(`http://localhost:5000/api/v1/bookings/classes/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete class");
};
