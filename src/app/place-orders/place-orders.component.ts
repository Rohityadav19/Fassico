import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Carts } from '../models/cart.model';
import { CartCountService } from '../service/CartCountShareServiec/cart-count.service';
import { CartService } from '../service/cartService/cart.service';
import { CheckAuthService } from '../service/checkAuthService/check-auth.service';
import { OrdersService } from '../service/orders/orders.service';
import { UserService } from '../service/userService/user.service';
@Component({
  selector: 'app-place-orders',
  templateUrl: './place-orders.component.html',
  styleUrls: ['./place-orders.component.css']
})
export class PlaceOrdersComponent implements OnInit {

  constructor(private sanitizer: DomSanitizer,private router:Router,private userService:UserService,public checkAuthService: CheckAuthService,private fb: FormBuilder,private cartService:CartService, private orderService:OrdersService
    ,public cartCountService:CartCountService,public toastr: ToastrService) { }
  errorMessage="Loading......"
  useSameAddress:boolean=false
  user:any
  address:any;
  addNewAddress:any;
  regForm:any
  selectedOnSameAddress:boolean=true;
  selectedNewAddress:boolean=false;
  newAddressAdded:boolean=false;
  showPayment:boolean=false;
  cartCount:Number=0;
  regex = new RegExp("^[1-9][0-9]{5}$");

  paymentMethodForm:any
  showWallet:boolean=false
  viewReview:boolean=false;
  ngOnInit(): void {
    
    this.checkItemsAvailability()
    this.showPayment=true;
    this.showWallet=false
    this.viewReview=false;
    this.cart=[]
    this.userService.getUser(this.checkAuthService.getToken()).subscribe(data=>{
      this.user=data;
      this.address=data.houseNo+", "+data.street+", "+data.city+", "+data.district+", "+data.state+", "+data.pincode;
      this.newAddressAdded=false;
      this.addNewAddress="";
    })
    this.regForm = this.fb.group({
      
      houseNo: ['',[Validators.required]],
      street:['',[Validators.required,Validators.pattern('^[a-zA-Z \-\']+')]],
      city:['',[Validators.required,Validators.pattern('^[a-zA-Z \-\']+')]],
      district:['',[Validators.required,Validators.pattern('^[a-zA-Z \-\']+')]],
      state:['',[Validators.required,Validators.pattern('^[a-zA-Z \-\']+')]],
      pincode:['',[Validators.required,Validators.pattern(this.regex)]],
      landmark:['']

      })
      this.paymentMethodForm=this.fb.group({
        paymentMethod:['',[Validators.required]]
      })
  } 
  sameAddress(event:Event){
    this.checkItemsAvailability()
    this.ngOnInit();
    this.selectedOnSameAddress=(<HTMLInputElement>event.target).value=="sameadd"
    this.selectedNewAddress=false;
    this.showPayment=true;
  }
  newAddress(event:Event){
    this.checkItemsAvailability()
    this.ngOnInit();
    this.selectedNewAddress=(<HTMLInputElement>event.target).value=="newadd"
    this.selectedOnSameAddress=false;
    this.showPayment=false;
  }
  onSubmit(){
    this.checkItemsAvailability()
    let data=this.regForm.value;
    this.addNewAddress=data.houseNo+", "+data.street+", "+data.city+", "+data.district+", "+data.state+", "+data.pincode;
    this.selectedNewAddress=false;
    this.newAddressAdded=true;
    this.showPayment=true;
  }
  

 
  walletAmount:any=0
  totalPrice:any=0
  cart:Carts[]=[]
  selectedWalletPaymentMethod:boolean=false

  changePaymentMethod(event:Event){
    this.checkItemsAvailability()
    this.selectedWalletPaymentMethod=false
    this.viewReview=false;
    this.walletAmount=-1;
    this.totalPrice=-1;
    this.cart=[]
    if(this.paymentList[0].methodValue===(<HTMLInputElement>event.target).value){
      this.selectedWalletPaymentMethod=true
      this.userService.getUserWalletAmount(this.checkAuthService.getToken()).subscribe(data=>{
        this.walletAmount=data;
        this.cartService.getCartItems(this.checkAuthService.getToken()).subscribe(data1=>{
          data1.forEach(d=>{
            let objectURL = 'data:image/jpeg;base64,' + d.item.primaryImage;
            d.item.primaryImage = this.sanitizer.bypassSecurityTrustUrl(objectURL)
          })
          this.cart=data1;
          this.cart[0].item.itemImage
          data1.forEach(d=>{
            this.totalPrice+=(Number(d.quantity)*d.item.price)
            this.showWallet=true;
            
          })
          this.totalPrice=this.totalPrice+1
        })
        return data;
      })
      
    }else{
      this.showWallet=false;
      this.viewReview=true;
      this.cartService.getCartItems(this.checkAuthService.getToken()).subscribe(data1=>{
        data1.forEach(d=>{
          let objectURL = 'data:image/jpeg;base64,' + d.item.primaryImage;
          d.item.primaryImage = this.sanitizer.bypassSecurityTrustUrl(objectURL)
        })
        this.cart=data1;
        data1.forEach(d=>{
          this.totalPrice+=(Number(d.quantity)*d.item.price)
          
        })
        this.totalPrice=this.totalPrice+1
      })
    }
  }
  makePaymentMethod(){
    this.checkItemsAvailability()
    this.viewReview=true
  }
  placeOrder(){
    // this.checkItemsAvailability()   
    let orderRequest:RequestOrder
    let finalAddress=""
    let finalPaymentMethod:String="";
    if(this.selectedOnSameAddress){
      finalAddress=this.address      
    }else if(!this.selectedOnSameAddress){
      finalAddress=this.addNewAddress;
    }
    if(this.selectedWalletPaymentMethod){
      finalPaymentMethod=this.paymentList[0].methodKey
    }else{
      finalPaymentMethod=this.paymentList[1].methodKey
    }

    orderRequest={
      'paymentMethod':finalPaymentMethod,
      'deliveryAddress':finalAddress
    }
    this.orderService.placeOrder(orderRequest,this.checkAuthService.getToken()).subscribe(data=>{
      this.cartService.getUSerCartCount(this.checkAuthService.getToken()).subscribe(data=>{
        this.cartCountService.changeMessage(data.toString());
      })
      this.router.navigate(['orders']);
    },error=>{
      this.toastr.error("Error Orrcured While Placing Order","Try Again",{ progressBar: true,
        timeOut:3*1000 })
      this.router.navigate(['cart']);
    })

  } 
  
  checkItemsAvailability(){
    this.cartService.getCartItems(this.checkAuthService.getToken()).subscribe(data=>{
      let itemsAvailable=true
      data.forEach(da=>{
        if(da.item.quanitity<da.quantity){
          itemsAvailable=false
          this.toastr.warning(da.item.itemName+" : Selected Quantity is Not Available For This Item, Please Try Again By Reducing The Quantity","Out Of Stock",
          { progressBar: true,
        timeOut:5*1000 }) 
        }

        this.cartCount=Number(this.cartCount)+Number(da.quantity);
      })
      if(!itemsAvailable){
        this.router.navigate(['cart'])
      }
      if(this.cartCount<=0){
        this.errorMessage="Please Add Items To The Cart And Place For Order....";
      }
    })
  }
  get f() {
    return this.regForm.controls;
  }
  get ff(){
    return this.paymentMethodForm.controls;
  }

  paymentList:PaymentMethods[]=[{
    'methodKey':'WALLET',
    'methodValue':'Wallet'
  },{
    'methodKey':'PAY_ON_DELIVERY',
    'methodValue':'Pay on Delivery'
  }]

}

export interface PaymentMethods{
  methodKey:String,
  methodValue:String
}
export interface RequestOrder{
  paymentMethod:String,
  deliveryAddress:String
}