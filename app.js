var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var path = require('path');
var r = require('rethinkdb');

app.set('port', (process.env.PORT || 5000));
app.use(express.static(path.join(__dirname, 'public/')));

app.get('/dashboard', function (req, res) {
    res.sendFile(path.join(__dirname, 'views/dashboard.html'));
});
app.get('/kendoDashboard', function (req, res) {
    res.sendFile(path.join(__dirname, 'views/kendoDashboard.html'));
});

var invoiceData = {
        recordedInvoiceCount: 0,
        rejectedInvoiceCount: 0,
        preparedInvoiceCount: 0,
        sentInvoiceCount: 0,
        pendingInvoiceCount: 0,
        signedInvoiceCount: 0,
        transactionFees: [],
        countByCustomer : [],
        countBySubmitter : [],
        countByState : [],
        countByStateAndInvoiceType : []
};

r.connect({ host: '10.20.88.139', port: 28015 }).then(function(connection){
    var invoiceTable = r.db('Dashboard').table('Invoiceuments');
    invoiceTable.changes().run(connection, function(err, cursor){
        if(err){
            throw err;
        }
       
        cursor.each(function(err, row){
            if(err){
                throw err;
            }
            updateInvoiceNumbers(connection);
        });
    });
    
    io.on('connection', function (socket) {
        console.log("Intialize invoice counts");
        updateInvoiceNumbers(connection);    
    });
});

var updateInvoiceNumbers = function(connection){
    r.db('Dashboard').table('Invoiceuments')('Step').count('Recorded').run(connection,updateRecordedInvoices);
    r.db('Dashboard').table('Invoiceuments')('Step').count('Rejected').run(connection,updateRejectedInvoices);
    r.db('Dashboard').table('Invoiceuments')('Step').count('Ready to Send (TAL)').run(connection,updatePreparedInvoices);
    r.db('Dashboard').table('Invoiceuments')('Step').count('Send (via Hub)').run(connection,updateSentInvoices);
    r.db('Dashboard').table('Invoiceuments')('Step').count('Pending').run(connection,updatePendingInvoices);
    r.db('Dashboard').table('Invoiceuments')('Step').count('Signed').run(connection,updateSignedInvoices);
    //count by customer
    r.db('Dashboard').table('Invoiceuments').group("IntegrationCustomer").count().ungroup().map({"CustomerName": r.row("group"),"count": r.row("reduction")}).run(connection,updateCountByCustomer);    
    //count by Submitter
    r.db('Dashboard').table('Invoiceuments').group("SubmitterName").count().ungroup().map({"SubmitterName": r.row("group"),"count": r.row("reduction")}).run(connection,updateCountBySubmitter);
    //count by state
    r.db('Dashboard').table('Invoiceuments').group("State").count().ungroup().map({"State": r.row("group"),"count": r.row("reduction")}).run(connection,updateCountByState); 
    // count by state and invoicetype
    r.db('Dashboard').table('Invoiceuments').group(function(Invoiceument){return Invoiceument.pluck('State','InvoiceType')}).count().ungroup().map({"State" : r.row('group')('State'),"InvoiceType" : r.row('group')('InvoiceType'),"count" : r.row('reduction')}).run(connection,updateCountByStateAndInvoiceType);
    // transactionFee
    r.db('Dashboard').table('Invoiceuments').group(function(Invoiceument){return Invoiceument.pluck('State', 'County')}).sum(r.row('TransactionFee').coerceTo('number')).run(connection,updateTransactionsFeeTotals);
}



var updateRecordedInvoices = function(err, result){
    if(err){
        throw err;
    }
    invoiceData.recordedInvoiceCount = result;
    io.sockets.emit('invoice-counts', invoiceData);
}

var updateRejectedInvoices = function(err, result){
    if(err){
        throw err;
    }
    invoiceData.rejectedInvoiceCount = result;
    io.sockets.emit('invoice-counts', invoiceData);
}

 
var updatePreparedInvoices = function(err, result){
    if(err){
        throw err;
    }
    invoiceData.preparedInvoiceCount = result;
    io.sockets.emit('invoice-counts', invoiceData);
}
 
var updateSentInvoices = function(err, result){
    if(err){
        throw err;
    }
    invoiceData.sentInvoiceCount = result;
    io.sockets.emit('invoice-counts', invoiceData);
}

var updatePendingInvoices = function(err, result){
    if(err){
        throw err;
    }
    invoiceData.pendingInvoiceCount = result;
    io.sockets.emit('invoice-counts', invoiceData);
}

var updateSignedInvoices = function(err, result){
    if(err){
        throw err;
    }
    invoiceData.signedInvoiceCount = result;
    io.sockets.emit('invoice-counts', invoiceData);
}

var updateTransactionsFeeTotals = function(err, result){
    if(err){
        throw err;
    }
    var transactionFees = [];    
    var index = result.length;
    for(i = 0; i < index; i++){
        transactionFees.push( {
            state: result[i].group.State,
            county: result[i].group.County,
            feeTotal: result[i].reduction
        });                
    }
    invoiceData.transactionFees = transactionFees;
    io.sockets.emit('invoice-counts', invoiceData)
}

var updateCountByCustomer= function(err,result){
    if(err){
            throw err;
        }
    invoiceData.countByCustomer = result;
    io.sockets.emit('invoice-counts', invoiceData);

}

var updateCountBySubmitter= function(err,result){
    if(err){
            throw err;
        }
    invoiceData.countBySubmitter = result;
    io.sockets.emit('invoice-counts', invoiceData);

}

var updateCountByState= function(err,result){
    if(err){
            throw err;
        }
    invoiceData.countByState = result;
    io.sockets.emit('invoice-counts', invoiceData);
}

var updateCountByStateAndInvoiceType = function(err,result){
    if(err){
            throw err;
        }       
    invoiceData.countByStateAndInvoiceType = result;
    io.sockets.emit('invoice-counts', invoiceData);
}

http.listen(app.get('port'), function () {
    console.log('listening on *:' + app.get('port'));
});