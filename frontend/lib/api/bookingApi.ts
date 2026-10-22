export interface IBooking {
  _id: string;
  memberName: string;
  classId: string;
  trainerId: string;
  facilityId: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}

// Fetch all bookings
export const fetchBookings = async (): Promise<IBooking[]> => {
  const res = await fetch("http://localhost:5000/api/v1/bookings");
  if (!res.ok) throw new Error("Failed to fetch bookings");
  const data = await res.json();
  return data.data;
};

// Create a new booking
export const addBooking = async (booking: Partial<IBooking>): Promise<IBooking> => {
  const res = await fetch("http://localhost:5000/api/v1/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(booking),
  });
  if (!res.ok) throw new Error("Failed to add booking");
  const data = await res.json();
  return data.data;
};

// Update a booking
export const updateBooking = async (id: string, booking: Partial<IBooking>): Promise<IBooking> => {
  const res = await fetch(`http://localhost:5000/api/v1/bookings/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(booking),
  });
  if (!res.ok) throw new Error("Failed to update booking");
  const data = await res.json();
  return data.data;
};

// Delete a booking
export const deleteBooking = async (id: string): Promise<void> => {
  const res = await fetch(`http://localhost:5000/api/v1/bookings/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete booking");
};
