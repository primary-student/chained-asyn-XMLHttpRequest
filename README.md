# chained-asyn-XMLHttpRequest
A chain tool puts each request in the callback function of the previous one.
## Usage
```
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
```
