import type { Request, Response } from "express";

export const webhookHandler = async (req: Request, res: Response) => {
  try {
    console.log("Vapi webhook received:", {
      method: req.method,
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Extract relevant information from Vapi webhook
    const { message, type, call_id, customer, transcript } = req.body;

    // Log different types of interactions for debugging
    if (type === 'conversation') {
      console.log('Conversation message:', message);
      console.log('Transcript:', transcript);
    } else if (type === 'call_started') {
      console.log('Call started for customer:', customer);
    } else if (type === 'call_ended') {
      console.log('Call ended for customer:', customer);
    } else if (type === 'function_call') {
      console.log('Function call requested:', message);
    }

    // For now, acknowledge all webhooks
    // In production, this would handle different conversation flows
    // and potentially trigger backend actions

    res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      timestamp: new Date().toISOString(),
      type: type || 'unknown',
      call_id: call_id
    });
  } catch (error) {
    console.error("Webhook handler error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
};