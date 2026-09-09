CREATE TABLE Orders (
    Order_ID NUMBER PRIMARY KEY,
    Customer_Name VARCHAR2(50),
    Amount NUMBER(10,2)
);
INSERT INTO Orders VALUES (101, 'Rahul', 15000);
INSERT INTO Orders VALUES (102, 'Amit', 8000);
INSERT INTO Orders VALUES (103, 'Priya', 12000);
INSERT INTO Orders VALUES (104, 'Neha', 5000);
INSERT INTO Orders VALUES (105, 'Karan', 25000);

SET SERVEROUTPUT ON;

DECLARE
    CURSOR order_cursor IS
        SELECT Order_ID, Amount
        FROM Orders;

BEGIN
    FOR ord IN order_cursor
    LOOP
        IF ord.Amount > 10000 THEN
            DBMS_OUTPUT.PUT_LINE(
                'Order ' || ord.Order_ID || ': High Value'
            );
        END IF;
    END LOOP;
END;
/
    
