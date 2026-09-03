'use client';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-text-main">AI Analytics</h1>
          <p className="text-text-muted mt-1 text-sm tracking-widest uppercase">Predictive Insights & Reports</p>
        </div>
        <div className="flex gap-2">
          <select className="bg-panel border border-border-subtle text-text-main text-sm rounded px-4 py-2 focus:outline-none focus:border-yellow-500">
            <option>Today</option>
            <option>Last 7 Days</option>
            <option>This Month</option>
          </select>
          <button className="bg-page border border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 font-bold py-2 px-4 rounded text-xs uppercase tracking-widest transition-colors">
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Demand Prediction */}
        <div className="lg:col-span-2 bg-panel border border-border-subtle rounded-xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-lg font-bold uppercase tracking-widest text-text-main">Demand Prediction</h2>
              <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Expected orders by hour</p>
            </div>
            <span className="flex items-center gap-2 text-xs font-bold text-blue-400 bg-blue-900/30 px-2 py-1 rounded border border-blue-900">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              AI Generated
            </span>
          </div>
          
          <div className="h-64 flex items-end justify-between gap-2 pt-10">
            {/* Mock Chart */}
            {[40, 30, 20, 15, 25, 45, 80, 100, 95, 60, 40, 20].map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="relative w-full flex items-end justify-center h-full">
                  <div 
                    className={`w-full max-w-[20px] rounded-t transition-all duration-1000 ${i === 7 || i === 8 ? 'bg-yellow-500 shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-panel-hover group-hover:bg-gray-600'}`}
                    style={{ height: `${val}%` }}
                  ></div>
                  
                  {/* Tooltip */}
                  <div className="absolute -top-8 bg-page border border-border-subtle text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                    {val} orders
                  </div>
                </div>
                <span className="text-[10px] text-text-muted">{i + 12}h</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-panel border border-border-subtle rounded-xl p-6 flex flex-col">
          <h2 className="text-lg font-bold uppercase tracking-widest text-text-main mb-6">AI Insights</h2>
          
          <div className="space-y-4 flex-1">
            <div className="bg-page border border-border-subtle p-4 rounded-lg">
              <div className="flex gap-3 mb-2">
                <span className="text-yellow-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </span>
                <h3 className="font-bold text-sm">Surge Pricing Opportunity</h3>
              </div>
              <p className="text-xs text-text-muted">High demand expected between 7PM-9PM. Consider activating dynamic pricing (+10%) for high-selling items.</p>
            </div>

            <div className="bg-page border border-border-subtle p-4 rounded-lg">
              <div className="flex gap-3 mb-2">
                <span className="text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </span>
                <h3 className="font-bold text-sm">Inventory Warning</h3>
              </div>
              <p className="text-xs text-text-muted">Based on current run rate, "Truffle Mushroom" will stock out in approx 4 hours.</p>
            </div>
            
            <div className="bg-page border border-border-subtle p-4 rounded-lg">
              <div className="flex gap-3 mb-2">
                <span className="text-green-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </span>
                <h3 className="font-bold text-sm">Robot Efficiency</h3>
              </div>
              <p className="text-xs text-text-muted">Robot fleet is operating at 92% efficiency. No bottlenecks detected.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
