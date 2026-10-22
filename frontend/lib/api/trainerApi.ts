export interface ITrainer {
  _id: string;
  name: string;
  expertise: string;
  status: "active" | "inactive";
  createdAt: string;
}

// Fetch all trainers
export const fetchTrainers = async (): Promise<ITrainer[]> => {
  const res = await fetch("http://localhost:5000/api/v1/bookings/trainers");
  if (!res.ok) throw new Error("Failed to fetch trainers");
  const data = await res.json();
  return data.data;
};

// Add a new trainer
export const addTrainer = async (trainer: Partial<ITrainer>): Promise<ITrainer> => {
  const res = await fetch("http://localhost:5000/api/v1/bookings/trainers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trainer),
  });
  if (!res.ok) throw new Error("Failed to add trainer");
  const data = await res.json();
  return data.data;
};

// Update trainer
export const updateTrainer = async (id: string, trainer: Partial<ITrainer>): Promise<ITrainer> => {
  const res = await fetch(`http://localhost:5000/api/v1/bookings/trainers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trainer),
  });
  if (!res.ok) throw new Error("Failed to update trainer");
  const data = await res.json();
  return data.data;
};

// Delete trainer
export const deleteTrainer = async (id: string): Promise<void> => {
  const res = await fetch(`http://localhost:5000/api/v1/bookings/trainers/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete trainer");
};
