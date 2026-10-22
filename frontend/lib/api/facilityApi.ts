export interface IFacility {
  _id: string;
  name: string;
  type: string;
  status: "active" | "inactive";
  createdAt: string;
}

// Fetch all facilities
export const fetchFacilities = async (): Promise<IFacility[]> => {
  const res = await fetch("http://localhost:5000/api/v1/bookings/facilities");
  if (!res.ok) throw new Error("Failed to fetch facilities");
  const data = await res.json();
  return data.data;
};

// Add a new facility
export const addFacility = async (facility: Partial<IFacility>): Promise<IFacility> => {
  const res = await fetch("http://localhost:5000/api/v1/bookings/facilities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(facility),
  });
  if (!res.ok) throw new Error("Failed to add facility");
  const data = await res.json();
  return data.data;
};

// Update facility
export const updateFacility = async (id: string, facility: Partial<IFacility>): Promise<IFacility> => {
  const res = await fetch(`http://localhost:5000/api/v1/bookings/facilities/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(facility),
  });
  if (!res.ok) throw new Error("Failed to update facility");
  const data = await res.json();
  return data.data;
};

// Delete facility
export const deleteFacility = async (id: string): Promise<void> => {
  const res = await fetch(`http://localhost:5000/api/v1/bookings/facilities/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete facility");
};
