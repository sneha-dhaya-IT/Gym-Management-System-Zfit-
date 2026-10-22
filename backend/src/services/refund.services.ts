import mongoose from 'mongoose';
import Refund from '../models/refund.model.js';

export const createRefundService = async (data: any) => {
        const refund = new Refund(data);
        return await refund.save();
};

export const getRefundsService = async (userId?: string) => {
        const filter = userId ? { userId } : {};
        return await Refund.find(filter);
};

export const getRefundByIdService = async (id: string) => {

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Invalid refund ID');
        }
        const refund = await Refund.findById(id);
        if (!refund) {
            throw new Error('Refund not found');
        }
        return refund;
};

export const updateRefundService = async (id: string, data: any) => {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Invalid refund ID');
        }
        const refund = await Refund.findByIdAndUpdate(id, data, { new: true });
        if (!refund) {
            throw new Error('Refund not found');
        }
        return refund;
};

export const deleteRefundService = async (id: string) => {

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error('Invalid refund ID');
        }
        const refund = await Refund.findByIdAndDelete(id);
        if (!refund) {
            throw new Error('Refund not found');
        }
        return refund;
};