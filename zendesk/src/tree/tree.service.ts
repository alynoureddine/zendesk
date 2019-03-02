import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TreeEntity } from './tree.entity';
import {__await} from "tslib";

@Injectable()
export class TreeService {
    constructor(
        @InjectRepository(TreeEntity)
        private readonly treeEntityRepository: Repository<TreeEntity>,
    ) {}

    async findAll(): Promise<TreeEntity[]> {
        return await this.treeEntityRepository.find();
    }

    async findOne(branchId: number): Promise<TreeEntity> {
        return await this.treeEntityRepository.findOne({branch_id: branchId});
    }

    async findBranchChildren(branchId: number): Promise<TreeEntity[]> {
        return await this.treeEntityRepository.find({parent_id: branchId});
    }

    // async findChildrenOfChild(branchId: number, button: string): Promise<TreeEntity[]> {
    //     await this.treeEntityRepository.find({parent_id: branchId}).then(async function (branchChildren) {
    //         for (let branchChild of branchChildren){
    //             if (branchChild.button == button)
    //                 return await this.treeEntityRepository.find({parent_id: branchId});
    //         }
    //     });
    // }

}
