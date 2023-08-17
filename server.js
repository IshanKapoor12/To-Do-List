import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});
  
const item2 = new Item({
    name: "Hit the + button to add a new item."
});
  
const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res){
    Item.find({})
        .then(foundItems=>{
            if(foundItems.length !== 0){
                res.render("list", {
                    listTitle:"Today", 
                    newListItems:foundItems
                });
            } else {
                Item.insertMany(defaultItems)
                    .then((result)=>{
                        console.log("Succesfully added default items to the DB");
                    })
                    .catch((err)=>{
                        console.log(err);
                    })
            }
        })
        .catch(err=>res.sendStatus(404));
});

app.get("/:customListName", function(req, res){
    const customListName = _.lowerCase(req.params.customListName);

    List.findOne({name: customListName})
        .then(foundList=>{
            if(!foundList){
                    const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/"+customListName);
            } else {
                res.render("list", {
                    listTitle: foundList.name, 
                    newListItems: foundList.items
                });
            }
        })
        .catch(err=>res.sendStatus(404));
});

app.post("/", function(req, res){
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });

    if(listName === "Today"){
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName})
            .then(foundList=>{
                foundList.items.push(item);
                foundList.save();
                res.redirect("/"+listName);
            });
    }
});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today") {
        Item.findByIdAndRemove(checkedItemId)
            .then(()=>{
                console.log("Item successfully deleted.");
                res.redirect("/");
            })
            .catch(err=>{
                console.log(err);
            })
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
            .then(()=>{
                res.redirect("/"+listName);
            })
            .catch(err=>{
                console.log(err);
            })
    }
});

app.get("/about", function(req, res){
    res.render("about");
});

app.listen(3000, function(){
    console.log("Server started on port 3000");
});
