create database sunil;
use  sunil;

create table loan (Name varchar(20) ,
Loan int(120) , Interest int (120) ,Remaining int(120) ,Action varchar(20))

select * from loan;

CREATE TABLE interest_history(
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(100),
    month_name VARCHAR(20),
    interest_amount INT
);

select * from interest_histroy;

DROP TABLE interest_history;

CREATE TABLE interest_history(
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(100),
    interest_amount INT,
    interest_date DATE
);

ALTER TABLE interest_history
ADD COLUMN month_name VARCHAR(20);

DESC interest_history;

select * from interest_history;


CREATE TABLE return_history(
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(100),
    return_amount INT,
    return_date DATE
);

DESC loan;

SELECT * FROM return_history;