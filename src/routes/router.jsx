import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ReceiptUpload from '../features/receipt/ReceiptUpload';
import ReceiptDetails from '../features/receipt/ReceiptDetails';
import AddFriend from '../features/friends/AddFriend';
import SplitBillPage from '../features/splitBill/SplitBillPage';
import SplitCompletePage from '../features/splitBill/SplitCompletePage';

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ReceiptUpload />} />
        <Route path="/details" element={<ReceiptDetails />} />
        <Route path="/add_friend" element={<AddFriend />} />
        <Route path="/split_bill" element={<SplitBillPage />} />
        <Route path="/split_complete" element={<SplitCompletePage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
