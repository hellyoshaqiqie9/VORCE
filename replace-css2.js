const fs = require('fs');
let code = fs.readFileSync('c:/vorce/src/app/admin/dashboard/page.tsx', 'utf8');

const newCSS = `
        .dashboard-container {
          max-width: 100%;
          margin: 0 auto;
          font-family: 'Inter', 'Montserrat', sans-serif;
          padding: 10px 0 40px;
          overflow-x: hidden;
        }

        .welcome-section {
          margin-bottom: 32px;
          padding: 20px 24px;
          background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.02);
          border: 1px solid rgba(241, 245, 249, 1);
        }

        .welcome-section h1 {
          font-size: 20px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 4px;
          letter-spacing: -0.2px;
        }

        .welcome-section p {
          color: #64748b;
          font-size: 13px;
          font-weight: 400;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        @media (max-width: 1200px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }

        .stat-card {
          background: #ffffff;
          padding: 20px;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
          cursor: pointer;
          border: 1px solid #f1f5f9;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          background: transparent;
          transition: background 0.3s ease;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
          border-color: #e2e8f0;
        }

        .stat-card .card-top {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .stat-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .stat-icon .material-icons {
          font-size: 18px;
        }

        .stat-icon.attendance { background: #dcfce7; color: #16a34a; }
        .stat-icon.leave { background: #e0e7ff; color: #4f46e5; }
        .stat-icon.tasks { background: #fef3c7; color: #d97706; }
        .stat-icon.reimburse { background: #fce7f3; color: #db2777; }

        .stat-card:nth-child(1):hover::before { background: #16a34a; }
        .stat-card:nth-child(2):hover::before { background: #4f46e5; }
        .stat-card:nth-child(3):hover::before { background: #d97706; }
        .stat-card:nth-child(4):hover::before { background: #db2777; }

        .stat-info {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .stat-info .label {
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
          letter-spacing: 0.2px;
          text-transform: uppercase;
        }

        .stat-trend {
          font-size: 11px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 12px;
        }

        .stat-trend.positive { background: #f0fdf4; color: #15803d; }
        .stat-trend.neutral { background: #f1f5f9; color: #475569; }
        .stat-trend.negative { background: #fff1f2; color: #be123c; }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: -0.5px;
        }

        .stat-value span {
          font-size: 13px;
          color: #94a3b8;
          font-weight: 500;
          margin-left: 4px;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 2fr 1.2fr;
          gap: 24px;
        }

        @media (max-width: 1024px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }
        }

        .card {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
          overflow: hidden;
          border: 1px solid rgba(226, 232, 240, 0.6);
        }

        .card-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(241, 245, 249, 0.8);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-header h3 {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          margin: 0;
        }

        .text-btn {
          background: none;
          border: none;
          color: #2563eb;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: color 0.2s;
        }
        
        .text-btn:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        .feed-list {
          padding: 8px 20px 20px;
        }

        .feed-item {
          padding: 12px;
          border-radius: 8px;
          background: #fafafb;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .feed-item:hover {
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
          border-color: #f1f5f9;
        }

        .feed-item .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
          color: #4f46e5;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 13px;
        }

        .feed-content {
            display: flex;
            flex-direction: column;
        }

        .feed-content p {
          margin: 0 0 2px 0;
          font-size: 13px;
          color: #334155;
          font-weight: 500;
        }

        .feed-content p strong {
          color: #0f172a;
          font-weight: 600;
        }

        .feed-content .time {
          font-size: 12px;
          color: #64748b;
          font-weight: 400;
        }

        .status {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 12px;
        }

        .status.on-time { background: #f0fdf4; color: #15803d; }
        .status.late { background: #fff1f2; color: #be123c; }

        .approval-list {
          padding: 8px 20px 20px;
        }

        .approval-item {
          padding: 14px;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
        }

        .approval-item:hover {
          border-color: #e2e8f0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }

        .approval-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .approval-icon .material-icons {
          font-size: 18px;
        }

        .approval-icon.reimburse { background: #fdf4ff; color: #c026d3; }
        .approval-icon.leave { background: #eff6ff; color: #3b82f6; }

        .approval-content {
          flex: 1;
        }

        .approval-content h4 {
          margin: 0 0 2px 0;
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
        }

        .approval-content p {
          margin: 0;
          font-size: 12px;
          color: #64748b;
          font-weight: 400;
        }

        .approval-actions {
          display: flex;
          gap: 8px;
        }

        .btn-process, .btn-approve {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-process:hover { background: #4338ca; }

        .btn-approve { background: #16a34a; }
        .btn-approve:hover { background: #15803d; }

        .btn-reject {
          background: transparent;
          color: #ef4444;
          border: 1px solid #fee2e2;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-reject:hover {
          background: #fef2f2;
          border-color: #fecaca;
        }

        .empty-approval {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          text-align: center;
          color: #64748b;
        }

        .empty-approval .material-icons {
          font-size: 32px;
          color: #cbd5e1;
          margin-bottom: 8px;
        }

        .empty-approval p {
          margin: 0;
          font-size: 13px;
          font-weight: 400;
        }

        .activity-section {
          margin-top: 24px;
        }

        .activity-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 12px;
          padding: 16px 20px 20px;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border: 1px solid #f1f5f9;
          border-radius: 12px;
          transition: all 0.2s;
        }
        
        .activity-item:hover {
          border-color: #e2e8f0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }

        .activity-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .activity-icon .material-icons { font-size: 16px; }

        .activity-icon.join { background: #f0fdf4; color: #16a34a; }

        .activity-content { flex: 1; display: flex; flex-direction: column; }
        .activity-content p { margin: 0; font-size: 13px; color: #334155; }
        .activity-time { font-size: 11px; color: #64748b; font-weight: 400; margin-right: 8px; }
        .activity-arrow { color: #cbd5e1; font-size: 18px; }
`;

const startIndex = code.indexOf('<style jsx>{`') + 13;
const endIndex = code.indexOf('`}</style>');

if (startIndex > 12 && endIndex > startIndex) {
  const newCode = code.substring(0, startIndex) + '\n' + newCSS + '\n' + code.substring(endIndex);
  fs.writeFileSync('c:/vorce/src/app/admin/dashboard/page.tsx', newCode);
  console.log('CSS Replaced Successfully!');
} else {
  console.log('Could not find CSS markers! startIndex:', startIndex, 'endIndex:', endIndex);
}
