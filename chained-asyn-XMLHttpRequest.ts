
interface I_request {
    url: string
    method: string

    header_map: Map<string, string>
    body: string

    if_request_successfull(response: object | string): boolean
}

class model {
    private request: I_request
    protected ui_modify_func: (response: object | string, if_request_successful: boolean) => void


    constructor(ui_modify_func: (response: object | string, if_request_successful: boolean) => void, request: I_request) {
        this.ui_modify_func = ui_modify_func
        this.request = request

    }

    modify_ui(response: object | string, if_request_successful: boolean): void {
        return this.ui_modify_func(response, if_request_successful)
    }

    get_request(): I_request {
        return this.request
    }



}


class chained_asyn_requestor {
    private model_queue: Array<model>
    private max_asyn_nums: number
    private abort_flag: boolean

    constructor(max_asyn_nums: number) {
        this.max_asyn_nums = max_asyn_nums
        this.model_queue = new Array<model>()
        this.abort_flag = false


    }

    get_queue_size(): number {
        return this.model_queue.length
    }

    queue_push(item: model): void {
        this.model_queue.push(item)
    }

    private queue_pop(): model {
        if (this.model_queue.length > 0) {
            return this.model_queue.shift()
        }
        else {
            throw new RangeError("This queue is empty now !")
        }
    }

    private create_xhr(model: model): XMLHttpRequest {
        let xhr: XMLHttpRequest
        xhr = new XMLHttpRequest()
        let req_info = model.get_request()

        xhr.open(req_info.method, req_info.url, true)

        for (let [key, value] of req_info.header_map) {
            xhr.setRequestHeader(key, value)
        }
        // xhr.responseType = 'json'
        

        let this_instance = this
        let callback = function () {
            let res = xhr.response
            if (model.get_request().if_request_successfull(res) == true) {
                model.modify_ui(res, true)
            }
            else {
                model.modify_ui(res, false)
            }

            if (this_instance.get_queue_size() > 0) {

                if (this_instance.abort_flag != true) {
                    let next_model = this_instance.queue_pop()
                    let next_xhr = this_instance.create_xhr(next_model)
                    next_xhr.send(next_model.get_request().body)
                }

            }
        }

        xhr.onload = callback
        xhr.onerror = callback

        return xhr
    }


    start() {
        this.abort_flag = false

        for (let i = 0; i < this.max_asyn_nums; i++) {
            if (this.get_queue_size() > 0) {
                let top_model = this.queue_pop()
                this.create_xhr(top_model).send(top_model.get_request().body)
            }
            else {
                break
            }

        }

    }

    stop(){
        this.abort_flag = true
    }



}




// test

// 1 Create a chained_asyn_requestor object, the parameter is a number to control how many asynchronous requests can be sent at the same time.
let chained_asyn_requestor_obj = new chained_asyn_requestor(4)


for (let i = 0; i <= 50; i++) {

    // 2 Create a request object that needs to meet interface I_request.
    let request: I_request
    request = {
        url: "http://127.0.0.1:9999/test?id="+String(i),
        method: "post",

        header_map: new Map<string, string>(),
        body: "body:"+String(i),

        if_request_successfull: (response: object | string) => { if (response != undefined && response != "") { return true } else { return false } }
    }
    request.header_map.set("header","header:"+String(i))


    // 3    Create model object with 2 parameters. 
    //      parameter1：ui_modify_func : (response: object | string, if_request_successful: boolean) => void
    //      parameter2：request object : The request object is used to describe some meta-info of a http request like url, method, header, body, 
                                        // and a function if_request_successfull(response: object | string): boolean which is used to check response if is expected
                                    
    let md = new model((res, if_request_successful) => { if(if_request_successful == true){console.log(res)}else{console.log(0-i,res)} }, request)

    // 4 Use chained_asyn_requestor.queue_push(model) push model object into the queue of chained_asyn_requestor.
    chained_asyn_requestor_obj.queue_push(md)

}

// console.log(chained_asyn_requestor_obj.get_queue_size())

// 5 start
chained_asyn_requestor_obj.start()