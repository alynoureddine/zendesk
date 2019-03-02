import * as mongoose from 'mongoose';

export const CustomerSchema = new mongoose.Schema({
    customer_id: Number,
    pos: Number,
    log: String,
});
