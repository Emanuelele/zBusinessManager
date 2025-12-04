import React, { useState } from 'react';

const Orders = () => {
  const [amount, setAmount] = useState(10);
  const pricePerUnit = 50;
  
  const handleOrder = () => {
    //console.log(`Ordering ${amount} units for $${amount * pricePerUnit}`);
    // Implement NUI callback here
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <h2 className="text-xl mb-2">{'>'} SUPPLY CHAIN MANAGEMENT</h2>

      <div className="flex gap-6 h-full">
        <div className="flex-1 border border-green-500 p-6 flex flex-col" style={{ border: '1px solid var(--terminal-green)' }}>
          <h3 className="text-lg mb-6">NEW ORDER</h3>
          
          <div className="flex-1 flex flex-col justify-center gap-6">
            <div>
              <label className="block mb-2 opacity-70">QUANTITY (UNITS)</label>
              <div className="flex items-center gap-4">
                <button 
                  className="btn px-4 py-2"
                  onClick={() => setAmount(Math.max(10, amount - 10))}
                >
                  -
                </button>
                <div className="text-3xl font-bold w-24 text-center">{amount}</div>
                <button 
                  className="btn px-4 py-2"
                  onClick={() => setAmount(amount + 10)}
                >
                  +
                </button>
              </div>
            </div>

            <div className="border-t border-green-500 pt-4" style={{ borderTop: '1px solid var(--terminal-green)' }}>
              <div className="flex justify-between mb-2">
                <span>UNIT PRICE:</span>
                <span>${pricePerUnit}</span>
              </div>
              <div className="flex justify-between text-xl font-bold">
                <span>TOTAL COST:</span>
                <span>${amount * pricePerUnit}</span>
              </div>
            </div>

            <button onClick={handleOrder} className="btn w-full py-4 mt-auto">
              CONFIRM ORDER
            </button>
          </div>
        </div>

        <div className="w-1/3 border border-green-500 p-4" style={{ border: '1px solid var(--terminal-green)' }}>
          <h3 className="mb-4 border-b border-green-500 pb-2" style={{ borderBottom: '1px solid var(--terminal-green)' }}>
            ORDER HISTORY
          </h3>
          <div className="opacity-50 text-center text-sm">
            NO RECENT ORDERS
          </div>
        </div>
      </div>
    </div>
  );
};

export default Orders;
