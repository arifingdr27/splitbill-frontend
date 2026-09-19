import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setEditedReceiptData, clearReceiptData } from './receiptSlice';
import {
  DEFAULT_RECEIPT,
  cloneReceipt,
  parseFieldValue,
  setValueAtPath,
  getTaxAmount,
  applyTaxDppRule,
  getDppForTotalDisplay,
} from '../../lib/receiptEdit';
import {
  formatCurrency,
  getReceiptCurrency,
  parseMoneyAmount,
} from '../../lib/formatCurrency';
import { resolveUnitPrice } from '../../lib/splitMath';
import { getUiLabels } from '../../lib/pdfLabels';
import ImageLightbox from '../../components/ImageLightbox';

function ReceiptDetails() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { receiptData, loading, error, originalImageUrl } = useSelector(
    (state) => state.receipt
  );
  const uiLanguage = useSelector((state) => state.ui.language);
  const t = getUiLabels(uiLanguage);

  const [isEditing, setIsEditing] = useState(false);
  const [editedReceipt, setEditedReceipt] = useState(null);
  const [originalTaxForDisplay, setOriginalTaxForDisplay] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (receiptData) {
      setEditedReceipt(cloneReceipt(receiptData));
      setHasUnsavedChanges(false);
      setOriginalTaxForDisplay(getTaxAmount(receiptData));
    } else if (!loading) {
      navigate('/');
    }
  }, [receiptData, loading, navigate]);

  useEffect(() => {
    if (editedReceipt && receiptData) {
      setHasUnsavedChanges(
        JSON.stringify(editedReceipt) !== JSON.stringify(receiptData)
      );
    } else {
      setHasUnsavedChanges(false);
    }
  }, [editedReceipt, receiptData]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (hasUnsavedChanges && isEditing) {
        event.preventDefault();
        event.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, isEditing]);

  const handleStartNewBill = () => {
    setShowCloseConfirm(true);
  };

  const handleConfirmClose = () => {
    setShowCloseConfirm(false);
    dispatch(clearReceiptData());
    navigate('/');
  };

  const handleCancelClose = () => {
    setShowCloseConfirm(false);
  };

  const displayedReceipt = receiptData || DEFAULT_RECEIPT;
  const currency = getReceiptCurrency(displayedReceipt);
  const totalItems = displayedReceipt.items.length;
  const payment = parseMoneyAmount(displayedReceipt.totals.payment);

  const handleInputChange = (e, path, type = 'text') => {
    const { value } = e.target;
    setEditedReceipt((prevReceipt) =>
      setValueAtPath(
        prevReceipt || DEFAULT_RECEIPT,
        path,
        parseFieldValue(value, type)
      )
    );
  };

  const handleItemChange = (e, itemIndex, fieldName, type = 'text') => {
    const { value } = e.target;
    setEditedReceipt((prevReceipt) => {
      const newReceipt = cloneReceipt(prevReceipt);
      const newItem = { ...newReceipt.items[itemIndex] };
      newItem[fieldName] = parseFieldValue(value, type);
      newReceipt.items[itemIndex] = newItem;
      return newReceipt;
    });
  };

  const handleSave = () => {
    const currentTaxInEditedReceipt = getTaxAmount(editedReceipt);
    setOriginalTaxForDisplay(currentTaxInEditedReceipt);

    const { receipt: finalEditedReceipt, didResetTax } =
      applyTaxDppRule(editedReceipt);

    if (didResetTax) {
      alert(t.taxResetAlert);
    }

    dispatch(setEditedReceiptData(finalEditedReceipt));
    setIsEditing(false);
    setHasUnsavedChanges(false);
  };

  const handleCancel = () => {
    setEditedReceipt(cloneReceipt(receiptData));
    setIsEditing(false);
    setHasUnsavedChanges(false);
    setOriginalTaxForDisplay(getTaxAmount(receiptData));
  };

  if (loading || editedReceipt === null) {
    return (
      <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
        <p className="text-lg font-semibold text-gray-700">
          {t.loadingReceiptDetails}
        </p>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-white p-4 text-center">
        <p className="text-lg font-semibold text-red-600 mb-4">
          {t.errorPrefix}: {error}
        </p>
        <button
          onClick={handleStartNewBill}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md"
        >
          {t.goBack}
        </button>
      </div>
    );
  }

  const totalDisplayValue = parseMoneyAmount(displayedReceipt.totals.total);
  const dppForTotalDisplay = getDppForTotalDisplay(displayedReceipt);

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-white">
      <div className="flex flex-col rounded-lg shadow-xl w-full max-w-md h-[99%] md:h-screen">
        <div className="flex-none flex justify-between items-center p-4 border-b bg-white h-12 md:h-16">
          <h2 className="text-xl font-semibold text-gray-800">
            {t.receiptDetailsTitle}
          </h2>
          <div className="flex items-center">
            {isEditing ? (
              <>
                <button
                  className="text-green-500 hover:text-green-700 mr-2 font-semibold"
                  onClick={handleSave}
                >
                  {t.save}
                </button>
                <button
                  className="text-gray-500 hover:text-gray-700 mr-2 font-semibold"
                  onClick={handleCancel}
                >
                  {t.cancel}
                </button>
              </>
            ) : (
              <button
                className="text-blue-500 hover:text-blue-700 mr-2 font-semibold"
                onClick={() => setIsEditing(true)}
              >
                {t.edit}
              </button>
            )}
            <button
              className="text-gray-500 hover:text-gray-700 flex items-center"
              onClick={handleStartNewBill}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-grow">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {t.uploadedReceipt}
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              {t.itemCountPayment(
                totalItems,
                formatCurrency(payment, currency)
              )}
            </p>
            <div className="rounded-md overflow-hidden shadow-sm">
              {(originalImageUrl || displayedReceipt.image_url) && (
                <button
                  type="button"
                  onClick={() =>
                    setPreviewImage(
                      originalImageUrl || displayedReceipt.image_url
                    )
                  }
                  className="block w-full cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                  aria-label={t.tapToEnlarge}
                >
                  <img
                    src={originalImageUrl || displayedReceipt.image_url}
                    alt={t.uploadedReceiptAlt}
                    className="w-full h-auto object-cover"
                  />
                </button>
              )}
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {t.detailsSection}
            </h3>
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
              <div>
                <p className="font-medium">{t.shopName}</p>
                {isEditing ? (
                  <input
                    type="text"
                    className="border rounded px-2 py-1 w-full text-gray-800"
                    value={editedReceipt?.store_information?.store_name || ''}
                    onChange={(e) =>
                      handleInputChange(e, 'store_information.store_name')
                    }
                  />
                ) : (
                  <p className="text-gray-800">
                    {displayedReceipt.store_information.store_name}
                  </p>
                )}
              </div>
              <div>
                <p className="font-medium">{t.shopAddress}</p>
                {isEditing ? (
                  <textarea
                    className="border rounded px-2 py-1 w-full text-gray-800"
                    value={editedReceipt?.store_information?.address || ''}
                    onChange={(e) =>
                      handleInputChange(e, 'store_information.address')
                    }
                    rows="2"
                  />
                ) : (
                  <p className="text-gray-800">
                    {displayedReceipt.store_information.address}
                  </p>
                )}
              </div>
              <div>
                <p className="font-medium">{t.date}</p>
                {isEditing ? (
                  <input
                    type="date"
                    className="border rounded px-2 py-1 w-full text-gray-800"
                    value={editedReceipt?.transaction_information?.date || ''}
                    onChange={(e) =>
                      handleInputChange(e, 'transaction_information.date')
                    }
                  />
                ) : (
                  <p className="text-gray-800">
                    {displayedReceipt.transaction_information.date}
                  </p>
                )}
              </div>
              <div>
                <p className="font-medium">{t.total}</p>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    className="border rounded px-2 py-1 w-full text-gray-800"
                    value={editedReceipt?.totals?.total || 0}
                    onChange={(e) =>
                      handleInputChange(e, 'totals.total', 'float')
                    }
                  />
                ) : (
                  <p className="text-gray-800">
                    {dppForTotalDisplay !== totalDisplayValue
                      ? t.totalWithDpp(
                          formatCurrency(totalDisplayValue, currency),
                          formatCurrency(dppForTotalDisplay, currency)
                        )
                      : t.totalLabelOnly(
                          formatCurrency(totalDisplayValue, currency)
                        )}
                  </p>
                )}
              </div>
              <div>
                <p className="font-medium">{t.discount}</p>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    className="border rounded px-2 py-1 w-full text-gray-800"
                    value={editedReceipt?.totals?.discount || 0}
                    onChange={(e) =>
                      handleInputChange(e, 'totals.discount', 'float')
                    }
                  />
                ) : (
                  <p className="text-gray-800">
                    {formatCurrency(
                      parseMoneyAmount(displayedReceipt.totals.discount),
                      currency
                    )}
                  </p>
                )}
              </div>
              <div>
                <p className="font-medium">{t.tax}</p>
                {isEditing ? (
                  <input
                    type="number"
                    step="0.01"
                    className="border rounded px-2 py-1 w-full text-gray-800"
                    value={
                      editedReceipt?.totals?.tax?.amount === ''
                        ? ''
                        : editedReceipt?.totals?.tax?.amount === 0
                          ? 0
                          : getTaxAmount(editedReceipt)
                    }
                    onChange={(e) =>
                      handleInputChange(e, 'totals.tax.amount', 'float')
                    }
                  />
                ) : (
                  <p className="text-gray-800">
                    {formatCurrency(originalTaxForDisplay, currency)}
                  </p>
                )}
              </div>
              {editedReceipt?.service_charge !== undefined && (
                <div>
                  <p className="font-medium">{t.serviceCharge}</p>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      className="border rounded px-2 py-1 w-full text-gray-800"
                      value={editedReceipt?.service_charge || 0}
                      onChange={(e) =>
                        handleInputChange(e, 'service_charge', 'float')
                      }
                    />
                  ) : (
                    <p className="text-gray-800">
                      {formatCurrency(
                        parseMoneyAmount(displayedReceipt.service_charge),
                        currency
                      )}
                    </p>
                  )}
                </div>
              )}
              {editedReceipt?.tax_amount !== undefined && (
                <div>
                  <p className="font-medium">{t.additionalTax}</p>
                  {isEditing ? (
                    <input
                      type="number"
                      step="0.01"
                      className="border rounded px-2 py-1 w-full text-gray-800"
                      value={editedReceipt?.tax_amount || 0}
                      onChange={(e) =>
                        handleInputChange(e, 'tax_amount', 'float')
                      }
                    />
                  ) : (
                    <p className="text-gray-800">
                      {formatCurrency(
                        parseMoneyAmount(displayedReceipt.tax_amount),
                        currency
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {t.itemsTitle}
            </h3>
            <div className="grid grid-cols-1 gap-2 text-sm text-gray-600">
              {editedReceipt?.items && editedReceipt.items.length > 0 ? (
                editedReceipt.items.map((item, i) => (
                  <div
                    key={item.id || `item-${i}`}
                    className="flex justify-between items-center border p-2 rounded-md"
                  >
                    <div className="flex-grow mr-2">
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            className="border rounded px-2 py-1 w-full mb-1 text-gray-800"
                            value={item.name || ''}
                            onChange={(e) => handleItemChange(e, i, 'name')}
                            placeholder={t.itemNamePlaceholder}
                          />
                          <div className="flex gap-2">
                            <input
                              type="number"
                              step="0.01"
                              className="border rounded px-2 py-1 w-1/2 text-gray-800"
                              value={item.price || 0}
                              onChange={(e) =>
                                handleItemChange(e, i, 'price', 'float')
                              }
                              placeholder={t.pricePlaceholder}
                            />
                            <input
                              type="number"
                              step="1"
                              className="border rounded px-2 py-1 w-1/2 text-gray-800"
                              value={item.quantity || 1}
                              onChange={(e) =>
                                handleItemChange(e, i, 'quantity', 'integer')
                              }
                              placeholder={t.quantityPlaceholder}
                            />
                          </div>
                        </>
                      ) : (
                        <div>
                          <p className="font-medium text-gray-800">
                            {item.name}
                          </p>
                          <p className="text-gray-600">
                            {formatCurrency(resolveUnitPrice(item), currency)}
                            , {t.qtyLabel(item.quantity || 1)}
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="font-semibold text-gray-800">
                      {formatCurrency(
                        item.total != null && item.total !== ''
                          ? parseMoneyAmount(item.total)
                          : parseMoneyAmount(item.price) *
                              (parseMoneyAmount(item.quantity) || 1),
                        currency
                      )}
                    </p>
                  </div>
                ))
              ) : (
                <p>{t.noItemsFound}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-none p-6 border-t bg-white">
          <button
            onClick={() => navigate('/add_friend')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-md w-full"
          >
            {t.confirmAndSplit}
          </button>
        </div>
      </div>

      {showCloseConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 px-4">
          <div
            className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="close-confirm-title"
          >
            <h3
              id="close-confirm-title"
              className="text-lg font-semibold text-gray-900 mb-2"
            >
              {t.leaveDetailsTitle}
            </h3>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              {hasUnsavedChanges
                ? t.leaveDetailsUnsaved
                : t.leaveDetailsSaved}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelClose}
                className="flex-1 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                className="flex-1 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold"
              >
                {t.confirmLeave}
              </button>
            </div>
          </div>
        </div>
      )}

      <ImageLightbox
        src={previewImage}
        alt={t.uploadedReceiptAlt}
        closeLabel={t.closePreview}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}

export default ReceiptDetails;
