import {Injectable} from '@nestjs/common';
import {TreeService} from './tree/tree.service';
import {CustomerService} from "./customer/customer.service";
import {ZendeskService} from "./zendesk/zendesk.service";

@Injectable()
export class AppService {
    constructor(private readonly treeService: TreeService,
                private readonly zendeskService: ZendeskService,
                private readonly customerService: CustomerService) {
    }

    getHello(): any {
        return this.treeService.findAll();
    }

    getHelloo(): any {
        return this.customerService.findAll();
    }

    startZendesk(): any{
        this.zendeskService.start();
    }
    //
}
