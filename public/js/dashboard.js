var socket = io();

var vm = new Vue({
    el: '#app',
    data: {
        recordedInvoiceCount: 0,
        rejectedInvoiceCount: 0
    },
    created: function(){
        socket.on('invoice-counts', function(data){
            this.recordedInvoiceCount = data.recordedInvoiceCount;
            this.rejectedInvoiceCount = data.rejectedInvoiceCount;
        }.bind(this));
    }
});