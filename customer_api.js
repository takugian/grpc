const fakeDB = require('./customers.json');

const PROTO_PATH = __dirname + '/customer.proto';

const grpc = require('grpc');

const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });

const customerProto = grpc.loadPackageDefinition(packageDefinition).customer;

function streamCustomers(call) {
    fakeDB.forEach(function (item) {
        call.write(item);
    });
    call.end();
}

function listCustomers(call, callback) {
    let data = fakeDB.filter(item => item.gender == call.request.gender && item.is_active == call.request.is_active);
    callback(null, { data: data });
}

function findCustomerById(call, callback) {
    let data = fakeDB.find(item => item._id == call.id);
    callback(null, data);
}

function insertCustomer(call, callback) {
    let item = call.request;
    item.id = fakeDB.length + 1;
    item.is_active = true;
    fakeDB.push(item);
    callback(null, item);
}

function insertCustomerList(call, callback) {
    console.log(call.request);
    call.on('data', function (item) {
        item.id = fakeDB.length + 1;
        item.is_active = true;
        fakeDB.push(item);
    })
    call.on('end', function () {
        callback(null, null);
    })
}

function deleteCustomer(call, callback) {
    let item = call.request;
    fakeDB.splice(item - 1, 1);
    callback(null, null);
}


function main() {

    var server = new grpc.Server();

    server.addService(customerProto.CustomerService.service, {
        streamList: streamCustomers,
        list: listCustomers,
        findById: findCustomerById,
        insert: insertCustomer,
        insertList: insertCustomerList,
        delete: deleteCustomer
    })

    server.bind("127.0.0.1:50051", grpc.ServerCredentials.createInsecure());
    console.log("Server running...");
    server.start();

}

main();