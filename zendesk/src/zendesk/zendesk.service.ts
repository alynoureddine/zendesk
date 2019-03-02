import {Injectable} from '@nestjs/common';
import {TreeService} from "../tree/tree.service";
import {CustomerService} from "../customer/customer.service";
import any = jasmine.any;

@Injectable()
export class ZendeskService {
    constructor(private readonly treeService: TreeService,
                private readonly customerService: CustomerService) {
    }

    start() {
        const WebSocket = require("ws"); // https://github.com/websockets/ws
        const request = require("superagent"); // https://github.com/visionmedia/superagent

        const ACCESS_TOKEN = "wjydPrNbyaFo5tel8R51WWW8E4hfFuWuAEOMc4H0KhepDLeYuMTQX5Kz1yi4loso";

        const CHAT_API_URL = "https://chat-api.zopim.com/graphql/request";
        const REQUEST_ID = {
            MESSAGE_SUBSCRIPTION: 1,
            UPDATE_AGENT_STATUS: 2,
            SEND_MESSAGE: 3,
            GET_DEPARTMENTS: 4,
            TRANSFER_TO_DEPARTMENT: 5
        };
        const SUBSCRIPTION_DATA_SIGNAL = "DATA";
        const TYPE = {
            VISITOR: "Visitor"
        };

        const channelsToBeTransferred: any[] = [];
        let messageSubscriptionId: any;

        async function startAgentSession(access_token: string) {
            const query = `mutation($access_token: String!) {
        startAgentSession(access_token: $access_token) {
            websocket_url 
            session_id 
            client_id
        }
    }`;
            const variables = {access_token};

            console.log("[startAgentSession] Request sent");

            return await request
                .post(CHAT_API_URL)
                .set({
                    "Content-Type": "application/json"
                })
                .send({query, variables});
        }

        async function init(app: any) {
            console.log(app);
            try {
                const startAgentSessionResp = (await startAgentSession(ACCESS_TOKEN)).body;

                if (startAgentSessionResp.errors && startAgentSessionResp.errors.length > 0) {
                    console.log("[startAgentSession] Invalid access token");
                } else {
                    console.log(
                        "[startAgentSession] Successfully start agent session"
                    );

                    const {
                        websocket_url,
                        session_id,
                        client_id
                    } = startAgentSessionResp.data.startAgentSession;

                    const webSocket = new WebSocket(websocket_url);

                    webSocket.on("open", () => {
                        console.log(`[WebSocket] Successfully connected to ${websocket_url}`);

                        /*************************************************
                         * Periodic ping to prevent WebSocket connection *
                         * time out due to idle connection               *
                         *************************************************/
                        setInterval(() => {
                            webSocket.send(
                                JSON.stringify({
                                    sig: "PING",
                                    payload: +new Date()
                                })
                            );
                        }, 5000);

                        /***********************
                         * Update agent status *
                         ***********************/
                        const updateAgentStatusQuery = {
                            payload: {
                                query: `mutation { 
                        updateAgentStatus(status: ONLINE) { 
                            node {
                                id 
                            } 
                        }
                    }`
                            },
                            type: "request",
                            id: REQUEST_ID.UPDATE_AGENT_STATUS
                        };
                        webSocket.send(JSON.stringify(updateAgentStatusQuery));
                        console.log("[updateAgentStatus] Request sent");

                        /************************
                         * Message subscription *
                         ************************/
                        const messageSubscriptionQuery = {
                            payload: {
                                query: `subscription { 
                        message { 
                            node { 
                                id 
                                content 
                                channel { 
                                    id 
                                } 
                                from { 
                                    __typename
                                    display_name
                                } 
                            } 
                        } 
                    }`
                            },
                            type: "request",
                            id: REQUEST_ID.MESSAGE_SUBSCRIPTION
                        };
                        webSocket.send(JSON.stringify(messageSubscriptionQuery));
                        console.log("[message] Subscription request sent");
                    });

                    /************************************************
                     * Listen to messages from WebSocket connection *
                     ************************************************/
                    webSocket.on("message", (message: string) => {
                        const data = JSON.parse(message);

                        // Listen to successful message subscription request
                        if (data.id === REQUEST_ID.MESSAGE_SUBSCRIPTION) {
                            if (data.payload.errors && data.payload.errors.length > 0) {
                                console.log("[message] Failed to subscribe to message");
                            } else {
                                messageSubscriptionId = data.payload.data.subscription_id;
                                console.log("[message] Successfully subscribe to message");
                            }
                        }

                        // Listen to successful update agent status request
                        if (data.id === REQUEST_ID.UPDATE_AGENT_STATUS) {
                            if (data.payload.errors && data.payload.errors.length > 0) {
                                console.log("[updateAgentStatus] Failed to update agent status");
                            } else {
                                console.log("[updateAgentStatus] Successfully update agent status");
                            }
                        }

                        if (data.id === REQUEST_ID.SEND_MESSAGE) {
                            if (data.payload.errors && data.payload.errors.length > 0) {
                                console.log("[sendMessage] Failed to send message to visitor");
                            } else {
                                console.log(
                                    "[sendMessage] Successfully to send message to visitor"
                                );
                            }
                        }

                        if (data.id === REQUEST_ID.TRANSFER_TO_DEPARTMENT) {
                            if (data.payload.errors && data.payload.errors.length > 0) {
                                console.log("[transferToDepartment] Failed to transfer visitor to a department");
                            } else {
                                console.log(
                                    "[transferToDepartment] Successfully to transfer visitor to a department"
                                );
                            }
                        }

                        if (data.id === REQUEST_ID.GET_DEPARTMENTS) {
                            const channelToBeTransferred = channelsToBeTransferred.pop();

                            if (data.payload.errors && data.payload.errors.length > 0) {
                                console.log("[getDepartments] Failed to get departments info");
                            } else {
                                console.log(
                                    "[getDepartments] Successfully to get departments info"
                                );

                                const allDepartments = data.payload.data.departments.edges;
                                const onlineDepartments = allDepartments.filter((department: { node: { status: string; }; }) => department.node.status === 'ONLINE');

                                if (onlineDepartments.length > 0) {
                                    const pickRandomDepartment = Math.floor(Math.random() * onlineDepartments.length);
                                    const onlineDepartment = onlineDepartments[pickRandomDepartment].node;

                                    /********************************************************
                                     * Notify visitor that they are going to be transferred *
                                     ********************************************************/
                                    const sendMessageQuery = {
                                        payload: {
                                            query: `mutation { 
                                        sendMessage(
                                            channel_id: "${channelToBeTransferred}", 
                                            msg: "You are going to be transferred to ${onlineDepartment.name} department shortly"
                                        ) {
                                            success
                                        }
                                    }`
                                        },
                                        type: "request",
                                        id: REQUEST_ID.SEND_MESSAGE
                                    };

                                    webSocket.send(JSON.stringify(sendMessageQuery));

                                    /***********************************
                                     *Transfer channel to a department *
                                     ***********************************/
                                    const transferToDepartmentQuery = {
                                        payload: {
                                            query: `mutation {
                                        transferToDepartment(
                                            channel_id: "${channelToBeTransferred}", 
                                            department_id: "${onlineDepartment.id}") {
                                          success
                                        }
                                      }`
                                        },
                                        type: "request",
                                        id: REQUEST_ID.TRANSFER_TO_DEPARTMENT
                                    };

                                    webSocket.send(JSON.stringify(transferToDepartmentQuery));
                                } else {
                                    /****************************************************
                                     * Notify visitor that there is no online department*
                                     ****************************************************/
                                    const sendMessageQuery = {
                                        payload: {
                                            query: `mutation { 
                                        sendMessage(
                                            channel_id: "${channelToBeTransferred}", 
                                            msg: "Sorry, there is no online department at the moment"
                                        ) {
                                            success
                                        }
                                    }`
                                        },
                                        type: "request",
                                        id: REQUEST_ID.SEND_MESSAGE
                                    };

                                    webSocket.send(JSON.stringify(sendMessageQuery));
                                }
                            }
                        }

                        // Listen to chat messages from the visitor
                        if (
                            data.sig === SUBSCRIPTION_DATA_SIGNAL &&
                            data.subscription_id === messageSubscriptionId &&
                            data.payload.data
                        ) {
                            const chatMessage = data.payload.data.message.node;
                            const sender = chatMessage.from;

                            if (sender.__typename === TYPE.VISITOR) {
                                console.log(
                                    `[message] Received: '${chatMessage.content}' from: '${
                                        sender.display_name
                                        }'`
                                );

                                if (chatMessage.content.toLowerCase().includes('transfer')) {
                                    channelsToBeTransferred.push(chatMessage.channel.id);

                                    /*****************************************************************
                                     * Get current departments information for transferring the chat *
                                     *****************************************************************/
                                    const getDepartmentsQuery = {
                                        payload: {
                                            query: `query {
                                        departments {
                                          edges {
                                            node {
                                              id
                                              name
                                              status
                                            }
                                          }
                                        }
                                      }`
                                        },
                                        type: "request",
                                        id: REQUEST_ID.GET_DEPARTMENTS
                                    };

                                    webSocket.send(JSON.stringify(getDepartmentsQuery));
                                } else {
                                    // console.log("channel id : " + chatMessage.channel.id);
                                    // console.log("message : " + message);
                                    // console.log("websocket url: " + websocket_url);
                                    // console.log("session_id: " + session_id);
                                    // console.log("client_id: " + client_id);
                                    // console.log("request id: " + JSON.stringify(REQUEST_ID));
                                    let customerId = app.getCustomerId(sender.display_name);
                                    app.customerService.findOne(customerId).then(function (customer) {
                                        console.log(customer);
                                        let position;
                                        if (customer === null) {
                                            position = -1;
                                            app.customerService.create({
                                                customer_id: customerId,
                                                pos: -1,
                                                log: "",
                                            })
                                        } else {
                                            position = customer.pos;
                                        }
                                        console.log("pos = " + position);
                                        app.treeService.findBranchChildren(position).then(function (branchChildren) {
                                            let pressedChild = null;
                                            let pressedChildId = null;
                                            for (let branchChild of branchChildren){
                                                if (chatMessage.content == branchChild.button){
                                                    pressedChild = branchChild;
                                                    pressedChildId = branchChild.branch_id;
                                                }
                                            }
                                            if(position == -1)
                                                pressedChildId = 0;
                                            app.treeService.findBranchChildren(pressedChildId).then(function (branchChildrenOfChild) {
                                                app.treeService.findOne(position).then(function (branch) {
                                                    console.log(branch);
                                                    console.log(branchChildren);
                                                    app.reply(chatMessage, REQUEST_ID, webSocket, sender.display_name, branchChildren, branch, position, branchChildrenOfChild, pressedChild);
                                                });
                                            });

                                        });
                                    })

                                }
                            }
                        }
                    });
                }
            } catch (e) {
                console.log("[startAgentSession] Request fail");
            }
        }

        init(this);
    }

    reply(chatMessage: any, REQUEST_ID: { SEND_MESSAGE: any; }, webSocket: { send: (arg0: string) => void; }, displayName: any, branchChildren: any, branch: any, position: number, branchChildrenOfChild: any, pressedChild: any) {
        let messageQuery = this.getMessageQuery(chatMessage, displayName, branchChildren, branch, position, branchChildrenOfChild, pressedChild);
        const sendMessageQuery = {

            payload: {
                query: messageQuery
            },
            type: "request",
            id: REQUEST_ID.SEND_MESSAGE
        };

        webSocket.send(JSON.stringify(sendMessageQuery));
    }

    getMessageQuery(chatMessage: any, displayName: any, branchChildren: any, branch: any, position: number, branchChildrenOfChild:any, pressedChild: any) {
        let message =this.getNextMessage(chatMessage, displayName, branchChildren, branch, position, branchChildrenOfChild, pressedChild);
        let options =this.getNextOptions(chatMessage, displayName, branchChildren, branch, position, branchChildrenOfChild, pressedChild);

            return `mutation { 
            sendMessage(
                channel_id: "${chatMessage.channel.id}", 
                msg: "${message}",
                options: "${options}"
            ) {
                success
            }
        }`
    }

    getCustomerId(displayName: string): number {
        let idArray: string[] = displayName.split(" ");
        return parseInt(idArray[1]);
    }

    getNextMessage(chatMessage: any, displayName: any, branchChildren: any, branch: any, position: number, branchChildrenOfChild: any, pressedChild: any) {
        let customerId = this.getCustomerId(displayName);
        if(position == -1){
            this.customerService.updatePosition(customerId, 0);
            return branchChildren[0].text;
        }

        if (pressedChild == null){
            this.customerService.updatePosition(customerId, -1);
            return "chat with agent";
        }

        this.customerService.updatePosition(customerId, pressedChild.branch_id);
        return pressedChild.text;


    }

    getNextOptions(chatMessage: any, displayName: any, branchChildren: any, branch: any, position: number, branchChildrenOfChild: any, pressedChild: any){
        if (pressedChild == null && position != -1)
            return "";
        let optionsArray = [];
        for (let child of branchChildrenOfChild){
            optionsArray.push(child.button);
        }
        return optionsArray.join('/');
    }

}
