// Original SharePoint documents: browser links retain web=1; desktop links omit it.
window.HUB_SOPS = [
  { name: "Daily Operational Workflow", fileName: "1. SOP-Data_Data Team Daily Operational Workflow", format: "Word", number: "01" },
  { name: "Commission New Unit Procedures", fileName: "2. SOP-Data_Commission New Unit Procedures", format: "Word", number: "02" },
  { name: "Path Creation Guidelines and Procedures", fileName: "3. SOP-Data_Path Creation Guidelines and Procedures", format: "Word", number: "03" },
  { name: "Three Stage Check Procedures", fileName: "4. SOP-Data_Three Stage Check Procedures", format: "Word", number: "04" },
  { name: "Tableau Data Mapping Preparation and Upload Procedures", fileName: "5. SOP-Data_Tableau Data Mapping Preparation and Upload Procedures", format: "Word", number: "05" },
  { name: "Data Audit Guidelines and Procedures", fileName: "6. SOP-Data_Data Audit Guidelines and Procedures", format: "Word", number: "06" },
  { name: "Customer Data Collection and Inquiry Protocol", fileName: "7. SOP-Data_Customer Data Collection and Inquiry Protocol", format: "Word", number: "07" },
  { name: "DB Gurus Ticket Management", fileName: "8.  SOP- DB Gurus Ticket Management", format: "Word", number: "08" }
].map((item) => ({
  ...item,
  category: "Documents",
  url: `https://indtechnologyinc.sharepoint.com/sites/IND.TDataTeam/Shared%20Documents/General/Data%20Team%20Documents/Data%20Team%20SOP/${encodeURIComponent(item.fileName)}.docx?web=1`,
  wordUrl: `https://indtechnologyinc.sharepoint.com/sites/IND.TDataTeam/Shared%20Documents/General/Data%20Team%20Documents/Data%20Team%20SOP/${encodeURIComponent(item.fileName)}.docx`,
  owner: "Data Team",
  description: item.fileName,
  tags: ["sop", item.format.toLowerCase()],
  sop: true,
  pinned: false
}));
