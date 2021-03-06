import { Component, OnInit } from '@angular/core';
import { Orders } from '../models/Order.model';
import { CheckAuthService } from '../service/checkAuthService/check-auth.service';
import { OrdersService } from '../service/orders/orders.service';
import { Constants } from 'src/constants';  
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmCancellationComponent } from './confirm-cancellation/confirm-cancellation.component';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent implements OnInit {

  constructor(private sanitizer: DomSanitizer,private orderService:OrdersService,public checkAuth:CheckAuthService,private router: Router,public dialog: MatDialog) {
    if(!checkAuth.isUserLoggedIn()){
      router.navigate(['login'])
    }
   }


  paymentList:PaymentMethods[]=[]
  orders:Orders[]=[]
  cancelledOrders:Orders[]=[]
  ngOnInit(): void {

    this.paymentList=[{
      'methodKey':'WALLET',
      'methodValue':'Wallet'
    },{
      'methodKey':'PAY_ON_DELIVERY',
      'methodValue':'Pay on Delivery'
    }]

    this.orderService.getOrder(this.checkAuth.getToken()).subscribe(data=>{
      data.map((d)=>{
        let objectURL = 'data:image/jpeg;base64,' + d.item.primaryImage;
        d.item.primaryImage= this.sanitizer.bypassSecurityTrustUrl(objectURL)

        d.orderedDate=new Date(d.orderedDate.toString())
        d.canCancelOrderTill=new Date(d.orderedDate.getTime()+((Constants.order.orderCancellationDateLimit-1)* 24 * 60 * 60 * 1000))
        if(d.canCancelOrderTill>=new Date()){          
          d.enableToCancelOrder=true
        }
        if(d.paymentMethod===this.paymentList[0].methodKey){
          d.paymentMethod=this.paymentList[0].methodValue
        }else{
          d.paymentMethod=this.paymentList[1].methodValue
        }
      })
      this.orders=data.filter(d=>d.quantity>=d.cancallationQuatity)
      // if(this.orders.length>0){
      //   this.orders.forEach(d=>{
         
      //   })
      // }
      this.cancelledOrders=data.filter(d=>d.cancallationQuatity>0)
      // if(this.cancelledOrders.length>0){
      //   this.cancelledOrders.forEach(d=>{
      //     let objectURL = 'data:image/jpeg;base64,' + d.item.primaryImage;
      //     d.item.primaryImage= this.sanitizer.bypassSecurityTrustUrl(objectURL)
      //   })
      // }
    })
  
  }

  cancellationRequest:any={}

  openDialog(order:Orders): void {
    const dialogRef = this.dialog.open(ConfirmCancellationComponent, {
      // width: '250px',
      maxWidth:'90%',
      minWidth:'30%',
      data:{orderId:order.orderId,quantity:order.quantity,cancel:false}
      // data: {name: this.name, animal: this.animal}
    });

    dialogRef.afterClosed().subscribe(result => {
      if(result.cancel){
        cancellationRequest:this.cancellationRequest
        this.cancellationRequest={
        'orderId':result.orderId,
        'quantity':result.quantity,
        'reason':result.reason
        }
        // console.log(this.cancellationRequest)
        this.orderService.cancelOrder(this.checkAuth.getToken(), this.cancellationRequest).subscribe(data=>{
          this.ngOnInit();
        })
      }
      
      // console.log(this.cancellationRequest);
      // this.confirmCancellation=result
      // this.animal = result;
    });
  }

  getInvoice(orderId:String){
   
    this.orderService.getInvoices(this.checkAuth.getToken(),orderId).subscribe(
      data=>{
        window.open(`http://localhost:8751/order-service/orders/viewPdf/${orderId}`,"_blank");
      }
    );
  }
}
export interface ConfirmCancellation{
  'orderId':string,
  'quantity':number,
  'reason':string,
  'cancel':boolean
} 
export interface PaymentMethods{
  methodKey:String,
  methodValue:String
}