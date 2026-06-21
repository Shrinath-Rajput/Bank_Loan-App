const express = require("express");
const path = require("path");

const methodOverride=require("method-override")
const app = express();
const mysql=require("mysql2");
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "shrinath1814",
    database: "sunil"
});

connection.connect((err) => {
    if(err){
        console.log("Database Error :", err);
    } else {
        console.log("MySQL Connected Successfully");
    }
});


app.set("view engine", "ejs");
//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method")); 

// ejs template setup
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));



//style.css 
app.use(express.static(path.join(__dirname, "Public")));

//dashboad
app.get("/", (req, res) => {

    let q = `
        SELECT
            loan.Name,
            loan.Loan,
            loan.Interest,
            loan.Remaining,
            IFNULL(SUM(interest_history.interest_amount), 0) AS total_interest
        FROM loan
        LEFT JOIN interest_history
        ON loan.Name = interest_history.customer_name
        GROUP BY
            loan.Name,
            loan.Loan,
            loan.Interest,
            loan.Remaining
    `;

    connection.query(q, (err, results) => {

        if(err){
            console.log(err);
            return res.status(500).send("Database Error");
        }

        let totalGiven = 0;
        let totalInterest = 0;
        let totalPending = 0;

        results.forEach((loan) => {

            totalGiven += Number(loan.Loan);

            totalInterest += Number(loan.total_interest || 0);

            totalPending += Number(loan.Remaining);

        });

        let totalReceived = totalGiven + totalInterest;

        res.render("dashboard", {
            loans: results,
            totalGiven,
            totalInterest,
            totalReceived,
            totalPending
        });

    });

});

//add customer
app.get("/add-customer", (req, res) => {
    res.render("addcustomer");
});

app.get("/dashboad", (req, res) => {

    let q = `
    SELECT
        loan.*,
        IFNULL(SUM(interest_history.interest_amount),0) AS total_interest
    FROM loan
    LEFT JOIN interest_history
    ON loan.Name = interest_history.customer_name
    GROUP BY loan.Name, loan.Loan, loan.Interest, loan.Remaining, loan.Action
    `;

    connection.query(q, (err, results) => {

        if(err){
            console.log(err);
            return res.send("Database Error");
        }

        let totalGiven = 0;
        let totalInterest = 0;
        let totalPending = 0;

        results.forEach((loan) => {

            totalGiven += Number(loan.Loan);

            totalInterest += Number(loan.total_interest || 0);

            totalPending += Number(loan.Remaining);

        });

        let totalReceived = totalGiven + totalInterest;

        res.render("dashboard", {
            loans: results,
            totalGiven,
            totalInterest,
            totalReceived,
            totalPending
        });

    });

});
app.post("/customer/new", (req, res) => {

    let { name, loan, interest } = req.body;

    let q = `
        INSERT INTO loan
        (Name, Loan, Interest, Remaining)
        VALUES (?, ?, ?, ?)
    `;

    connection.query(
        q,
        [name, loan, interest, loan],
        (err, result) => {

            if(err){
                console.log(err);
                return res.send("Database Error");
            }

            res.redirect("/");
        }
    );
});

app.get("/interest/:name", (req, res) => {

    let name = req.params.name;

    res.render("interest", { name });

});

app.post("/interest/add", (req, res) => {

    let {
        customer_name,
        interest_amount,
        interest_date
    } = req.body;

    console.log(req.body);

    let q = `
        INSERT INTO interest_history
        (customer_name, interest_amount, interest_date)
        VALUES (?, ?, ?)
    `;

    connection.query(
        q,
        [
            customer_name,
            interest_amount,
            interest_date
        ],
        (err, result) => {

            if(err){
                console.log(err);
                return res.send(err.sqlMessage);
            }

            console.log("Interest Added Successfully");

            res.redirect("/");
        }
    );
});


app.get("/history/:name", (req, res) => {

    let name = req.params.name;

    let loanQuery = `
        SELECT *
        FROM loan
        WHERE Name = ?
        LIMIT 1
    `;

    let historyQuery = `
        SELECT *
        FROM interest_history
        WHERE customer_name = ?
        ORDER BY interest_date ASC
    `;

    connection.query(loanQuery, [name], (err, loanResult) => {

        if(err){
            console.log(err);
            return res.send("Database Error");
        }

        if(loanResult.length === 0){
            return res.send("Customer Not Found");
        }

        connection.query(historyQuery, [name], (err, historyResult) => {

            if(err){
                console.log(err);
                return res.send("Database Error");
            }

            res.render("history", {
                customer: loanResult[0],
                history: historyResult
            });

        });

    });

});
app.post("/return/add", (req, res) => {

    let {
        customer_name,
        return_amount,
        return_date
    } = req.body;

    let insertQuery = `
        INSERT INTO return_history
        (customer_name, return_amount, return_date)
        VALUES (?, ?, ?)
    `;

    connection.query(
        insertQuery,
        [customer_name, return_amount, return_date],
        (err, result) => {

            if(err){
                console.log(err);
                return res.send("Database Error");
            }

            let updateQuery = `
                UPDATE loan
                SET Remaining = Remaining - ?
                WHERE Name = ?
            `;

            connection.query(
                updateQuery,
                [return_amount, customer_name],
                (err, result) => {

                    if(err){
                        console.log(err);
                        return res.send("Database Error");
                    }

                    res.redirect("/");
                }
            );

        }
    );

});
app.get("/delete/:name", (req, res) => {

    let name = req.params.name;

    connection.query(
        "DELETE FROM interest_history WHERE customer_name = ?",
        [name],
        (err) => {

            if(err) return res.send("Database Error");

            connection.query(
                "DELETE FROM return_history WHERE customer_name = ?",
                [name],
                (err) => {

                    if(err) return res.send("Database Error");

                    connection.query(
                        "DELETE FROM loan WHERE Name = ?",
                        [name],
                        (err) => {

                            if(err) return res.send("Database Error");

                            res.redirect("/");
                        }
                    );
                }
            );
        }
    );
});


app.get("/return/:name", (req, res) => {

    let name = req.params.name;

    res.render("return", {
        name: name
    });

});

app.get("/customer/:name", (req, res) => {

    let name = req.params.name;

    let q = `
        SELECT
            loan.*,
            IFNULL(SUM(interest_history.interest_amount),0) AS total_interest
        FROM loan
        LEFT JOIN interest_history
        ON loan.Name = interest_history.customer_name
        WHERE loan.Name = ?
        GROUP BY loan.Name, loan.Loan, loan.Interest, loan.Remaining, loan.Action
    `;

    connection.query(q, [name], (err, result) => {

        if(err){
            console.log(err);
            return res.send("Database Error");
        }

        res.render("customer", {
            customer: result[0]
        });

    });

});


app.listen(5000, () => {
    console.log("Server Running On Port 5000");
});

