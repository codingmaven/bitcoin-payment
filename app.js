const keyPublishable = process.env.PUBLISHABLE_KEY;
const keySecret = process.env.SECRET_KEY;
const MyceliumGear = require('mycelium-gear');
const gateway = new MyceliumGear.Gateway(process.env.MYCELIUM_GATEWAY, process.env.MYCELIUM_SECRET);

const app = require("express")();
const stripe = require("stripe")(keySecret);

app.set("view engine", "pug");
app.use(require("body-parser").urlencoded({extended: false}));

app.get("/", (req, res) =>
  res.render("index.pug", {keyPublishable}));

app.post("/charge", (req, res) => {
  let amount = 500;
  
  stripe.customers.create({
    email: req.body.stripeEmail,
    card: req.body.stripeToken
  })
  .then(customer =>
    stripe.charges.create({
      amount,
      description: "Sample Charge",
      currency: "usd",
      customer: customer.id
    }))
  .catch(err => console.log("Error:", err))
  .then(charge => res.render("charge.pug"));
});

app.use("/mycelium/callback", (req, res) => {
  // This is Mycelium webhook, we can parse req.body and process on our side
  console.log(req.query, req.body);
  res.send("ok");
});

app.use("/mycelium/order-complete", (req, res) => {
  // On this url, we can render the payment completion page
  console.log(req.query, req.body);
  res.render("charge.pug");
});

app.post("/mycelium/charge", (req, res) => {
  const order   = new MyceliumGear.Order(gateway, 100, 'callback-data');
  console.log("sending order");
  order
    .send()
    .then((response) => {
      response.json().then((json) => {
        console.log("json", json);
        res.redirect(`https://gateway.gear.mycelium.com/pay/${json.payment_id}`);
      })
    })
    .catch((error) => {
      console.error(error)
    })
});

app.listen(4567);