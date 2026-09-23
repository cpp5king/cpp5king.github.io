// 使用者指定的示範輸入。程序選項未出現在示範欄位中，因此預設不勾選。
// 此檔僅供測試與文件示範，不由正式程式載入。
const input = {
  date: '2026-08-13', time: '23', subject: '無市招芋頭粿小作坊',
  attendees: ['operator', 'contractor', 'laboratory'],
  contractorName: '慧群環境科技股份有限公司', laboratoryName: '衛宇檢驗科技股份有限公司',
  operation: 'cooking', samplingDate: '2026-08-14', samplingStart: '00:07', samplingEnd: '00:09',
  bagCount: '1', samplingLocation: '該店適當距離', compliance: [], documentation: [], procedure: []
};
// 另測試「使用者逐項確認六項程序」後才可帶入參考紀錄中的完成敘述。
const confirmed = {
  ...input, compliance: ['compliant'], documentation: ['photos', 'signature'], procedure: ['sop', 'balanced', 'interference']
};
module.exports = { input, confirmed };
