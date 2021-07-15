let db;

// Create a new db request for a "budget" database.
const request = indexedDB.open("BudgetDB", 1);

request.onupgradeneeded = function (e) {
  db = e.target.result;

  db.createObjectStore("BudgetStore", { autoIncrement: true });
};

request.onerror = function (e) {
  console.log(`Error`);
};

function checkDatabase() {
  console.log("check db invoked");

  // Open a transaction on the BudgetStore db
  let transaction = db.transaction(["BudgetStore"], "readwrite");

  const store = transaction.objectStore("BudgetStore");

  // Get all records from BudgetStore
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    // If there are items in the store,add them back once back online
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((res) => {
          if (res.length !== 0) {
            transaction = db.transaction(["BudgetStore"], "readwrite");

            const currentStore = transaction.objectStore("BudgetStore");

            // Clear existing entries once the bulk add goes through
            currentStore.clear();
          }
        });
    }
  };
}

request.onsuccess = function (e) {
  console.log("success");
  db = e.target.result;

  // Check if app is online
  if (navigator.onLine) {
    checkDatabase();
  }
};

//save a record to the database
const saveRecord = (record) => {
  const transaction = db.transaction(["BudgetStore"], "readwrite");

  const store = transaction.objectStore("BudgetStore");

  store.add(record);
};

window.addEventListener("online", checkDatabase);
