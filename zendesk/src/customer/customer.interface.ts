import {Document} from 'mongoose';

export interface Customer extends Document {
    readonly customer_id: number;
    readonly  pos: number;
    readonly log: string;
}
