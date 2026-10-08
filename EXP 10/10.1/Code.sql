--codechef non-correlated subqueries
SELECT  f_name,f_cost,f_type FROM FOOD
WHERE f_cost>(SELECT avg(f_cost) FROM FOOD)
--second highest salary
SELECT MAX(salary) AS second_highest 
FROM employees 
WHERE salary < (
    SELECT MAX(salary) 
    FROM employees
);
--third highest salary
SELECT MAX(salary) AS ThirdHighestSalary 
FROM Employee 
WHERE salary < (
    SELECT MAX(salary) 
    FROM Employee 
    WHERE salary < (
        SELECT MAX(salary) FROM Employee
    )
);

