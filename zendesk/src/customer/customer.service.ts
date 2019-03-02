import {Model} from 'mongoose';
import {Injectable} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Customer} from "./customer.interface";
import {CreateCustomerDto} from "./create-customer.dto";


@Injectable()
export class CustomerService {
    constructor(@InjectModel('Customer') private readonly customerModel: Model<Customer>) {
    }

    async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
        const createdCustomer = new this.customerModel(createCustomerDto);
        return await createdCustomer.save();
    }

    async findAll(): Promise<Customer[]> {
        return await this.customerModel.find().exec();
    }

    async findOne(customerId: number): Promise<Customer[]> {
        return await this.customerModel.findOne({ customer_id: { $in: customerId } }).exec();
    }

    async updatePosition(customerId: number, Position: number): Promise<Customer[]> {
        return await this.customerModel.update({ customer_id: { $in: customerId}}, {$set: {"pos": Position}}).exec();
    }
}
