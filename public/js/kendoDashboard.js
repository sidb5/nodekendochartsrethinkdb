(function($) {
    
  var dashApp = angular.module('dashApp', ['kendo.directives']);
  
  dashApp.controller('DashboardController', function ($scope) {
    
    var kendoDashSocket = io();
    
    $scope.placeholder = function(element) {
      return element.clone().addClass("placeholder");
    };

    $scope.hint = function(element) {
      return element.clone().addClass("hint")
        .height(element.height())
        .width(element.width());
    };
    
    // when an item is dropped in either the side or
    // main containers, resize any Kendo UI widgets
    // inside
    $scope.dropped = function(e) {
      if (e.action === 'receive') {
        kendo.resize(e.item);
      }
    };
    
    
    //INIT DATA ARRAYS
     $scope.invoiceStatusData = new kendo.data.ObservableArray(
      [{ status: "Recorded", value: 0 },
        { status: "Rejected", value: 0 },
        { status: "Prepared", value: 0},
        { status: "Sent", value: 0},
      ]);
      
     $scope.transactionFees = new kendo.data.ObservableArray([]);      
     $scope.countByState = new kendo.data.ObservableArray([]);
     $scope.countByCustomer = new kendo.data.ObservableArray([]);
     $scope.countBySubmitter = new kendo.data.ObservableArray([]);
     $scope.recordedInvoiceCount = 0;
     $scope.rejectedInvoiceCount = 0;
      
         
    //DATA SOURCE OBJECTS
    $scope.status = new kendo.data.DataSource({
      data: $scope.invoiceStatusData
    });   
         
    $scope.invoiceStatus = new kendo.data.DataSource({      
      data:  $scope.invoiceStatusData
    });    
   
    
    
    //SOCKET UPDATES
   kendoDashSocket.on('invoice-counts', function(data){
     
                   console.log("kendoDashSocket received updated data");
                   
                    console.log('Data Count by Customer: ' + JSON.stringify(data.countByCustomer));
                                       
                     // clean kendo observable arrays and update with new data
                     $scope.invoiceStatusData.splice(0, $scope.invoiceStatusData.length);                     
                     $scope.invoiceStatusData.push.apply($scope.invoiceStatusData, 
                     [
                      { status: "Recorded", value:  data.recordedInvoiceCount },
                      { status: "Rejected", value: data.rejectedInvoiceCount },
                      { status: "Ready to Send", value: data.preparedInvoiceCount},
                      { status: "Send", value: data.sentInvoiceCount},
                      { status: "Pending", value: data.pendingInvoiceCount},
                      { status: "Signed", value: data.signedInvoiceCount}
                    ]);   
                    
                    
                     $scope.countByState.splice(0, $scope.countByState.length);                     
                     $scope.countByState.push.apply($scope.countByState, data.countByState);
                     
                     $scope.countByCustomer.splice(0, $scope.countByCustomer.length);                     
                     $scope.countByCustomer.push.apply($scope.countByCustomer, data.countByCustomer);
                     
                     $scope.countBySubmitter.splice(0, $scope.countBySubmitter.length);                     
                     $scope.countBySubmitter.push.apply($scope.countBySubmitter, data.countBySubmitter);
                    
                    

                     $scope.recordedInvoiceCount = data.recordedInvoiceCount;
                     $('#spanRecordedGauge').text("("+$scope.recordedInvoiceCount+")");
                     $scope.rejectedInvoiceCount = data.rejectedInvoiceCount;
                     $('#spanRejectedGauge').text("("+$scope.rejectedInvoiceCount+")");
                     
                     $('#recordedGauge').data("kendoLinearGauge").options.pointer.value = $scope.recordedInvoiceCount;
                     $('#recordedGauge').data("kendoLinearGauge").redraw();
                     $scope.rejectedInvoiceCount = data.rejectedInvoiceCount;
                     $('#rejectedRadialGauge').data("kendoRadialGauge").options.pointer.value = $scope.rejectedInvoiceCount;
                     $('#rejectedRadialGauge').data("kendoRadialGauge").redraw();
    });
  });
  
}(jQuery)); 