/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/error', 'N/record', 'N/runtime', 'N/url'],

		function(search, error, record, runtime, url) {

	/**
	 * Function definition to be triggered before record is loaded.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {string} scriptContext.type - Trigger type
	 * @param {Form} scriptContext.form - Current form
	 * @Since 2015.2
	 */
	function beforeLoad(scriptContext) {

	}

	/**
	 * Function definition to be triggered before record is loaded.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {Record} scriptContext.oldRecord - Old record
	 * @param {string} scriptContext.type - Trigger type
	 * @Since 2015.2
	 */

	var cgst = "cgst";
	var sgst = "sgst";
	var igst = "igst";

	function beforeSubmit(scriptContext) {

		//Get subsidiary value set in the script parameter.
		var scriptObj = runtime.getCurrentScript();
		var subsidiaryIndia = scriptObj.getParameter({
			name: 'custscript_gst_po_ue_indiasubsidiary'
		});
		log.debug("Script parameter of custscript1: ", subsidiaryIndia);

		//Variables declared to store the values fetched from the GST Tax Code Matrix for tax code, reversal tax code and reversal items for cgst, sgst and igst.
		var taxCodeId, revSGSTPurchaseItem, revSGSTPayableItem, revCGSTPurchaseItem, revCGSTPayableItem, revIGSTPurchaseItem, revIGSTPayableItem;
		var revTaxCode = '';

		//Current record object.
		var billObject = scriptContext.newRecord;

		var subsidiary = billObject.getValue({
			fieldId: 'subsidiary'
		});
		log.debug("subsidiary: ", subsidiary);
		//If subsidiary matches to India(set as script parameter).
		//  if (subsidiary == subsidiaryIndia) 
		if(subsidiaryIndia && (subsidiaryIndia == subsidiary)){
			log.debug("Inside if record found.", subsidiary);
			var gstType = billObject.getValue({
				fieldId: 'custbody_gst_gsttype'
			});
			var lineItemCount = billObject.getLineCount({
				sublistId: 'item'
			});
			var tempCountItem = lineItemCount - 1;
			var totalCgstAmount = Number(0);
			var totalSgstAmount = Number(0);
			var totalIgstAmount = Number(0);

			//Loop of items to process for calculating the tax amount.
			for (var i = 0; i < lineItemCount; i++) {

				//Get Reversal check-box value to accordingly calculate the tax amount.
				var isReversal = billObject.getSublistValue({
					sublistId: 'item',
					fieldId: 'custcol_gst_reversal_line',
					line: i
				});

				//Get other details of lines. Item, Amount and Tax Code.
				var getItem = billObject.getSublistValue({
					sublistId: 'item',
					fieldId: 'item',
					line: i
				});

				var getAmount = billObject.getSublistValue({
					sublistId: 'item',
					fieldId: 'amount',
					line: i
				});

				var getTaxCode = billObject.getSublistValue({
					sublistId: 'item',
					fieldId: 'taxcode',
					line: i
				});

				//Lookup on item to get the item's schedule id.
				var lookupScheduleId = search.lookupFields({
					type: 'item',
					id: getItem,
					columns: 'custitem_gst_itemschedule'
				});

				var scheduleId = lookupScheduleId.custitem_gst_itemschedule[0].value;

				//Search on GST Tax Code Matrix to get the tax code, reversal tax code, reversal purchase and payable items for cgst, sgst and igst.
				var filterTaxCodeMatrix = new Array();

				filterTaxCodeMatrix.push(search.createFilter({
					name: 'isinactive',
					operator: search.Operator.IS,
					values: false
				}));

				filterTaxCodeMatrix.push(search.createFilter({
					name: 'custrecord_gst_type',
					operator: search.Operator.IS,
					values: gstType
				}));

				if (scheduleId) {
					filterTaxCodeMatrix.push(search.createFilter({
						name: 'custrecord_gst_item_schedule',
						operator: search.Operator.IS,
						values: scheduleId
					}));
				};
				var columnTaxCodeMatrix = new Array();

				columnTaxCodeMatrix.push(search.createColumn({
					name: 'custrecord_gst_tax_code'
				}));

				columnTaxCodeMatrix.push(search.createColumn({
					name: 'custrecord_sgst_revpur_item'
				}));

				columnTaxCodeMatrix.push(search.createColumn({
					name: 'custrecord_sgst_revpay_item'
				}));

				columnTaxCodeMatrix.push(search.createColumn({
					name: 'custrecord_cgst_revpur_item'
				}));

				columnTaxCodeMatrix.push(search.createColumn({
					name: 'custrecord_cgst_revpay_item'
				}));

				columnTaxCodeMatrix.push(search.createColumn({
					name: 'custrecord_igst_revpur_item'
				}));

				columnTaxCodeMatrix.push(search.createColumn({
					name: 'custrecord_igst_revpay_item'
				}));

				columnTaxCodeMatrix.push(search.createColumn({
					name: 'custrecord_gst_reversal_taxcode'
				}));

				var searchTaxCodeMatrix = search.create({
					"type": "customrecord_gst_tax_code_matrix",
					"filters": filterTaxCodeMatrix,
					"columns": columnTaxCodeMatrix
				});

				var arraySearchTaxCodeMatrix = searchTaxCodeMatrix.run().getRange({
					start: 0,
					end: 1
				});

				//If search record found. Get the values of tax code, reversal tax code, and all the reversal items of cgst, sgst and igst.
				if (arraySearchTaxCodeMatrix[0] != '' && arraySearchTaxCodeMatrix[0] != null && arraySearchTaxCodeMatrix[0] != undefined && arraySearchTaxCodeMatrix[0] != 'null' && arraySearchTaxCodeMatrix[0] != 'undefined') {

					taxCodeId = arraySearchTaxCodeMatrix[0].getValue('custrecord_gst_tax_code');
					revSGSTPurchaseItem = arraySearchTaxCodeMatrix[0].getValue('custrecord_sgst_revpur_item');
					revSGSTPayableItem = arraySearchTaxCodeMatrix[0].getValue('custrecord_sgst_revpay_item');
					revCGSTPurchaseItem = arraySearchTaxCodeMatrix[0].getValue('custrecord_cgst_revpur_item');
					revCGSTPayableItem = arraySearchTaxCodeMatrix[0].getValue('custrecord_cgst_revpay_item');
					revIGSTPurchaseItem = arraySearchTaxCodeMatrix[0].getValue('custrecord_igst_revpur_item');
					revIGSTPayableItem = arraySearchTaxCodeMatrix[0].getValue('custrecord_igst_revpay_item');
					revTaxCode = arraySearchTaxCodeMatrix[0].getValue('custrecord_gst_reversal_taxcode');

					log.debug("Inside if search record found.", 'taxCodeId ' + taxCodeId + ' revSGSTPurchaseItem ' + revSGSTPurchaseItem + ' revSGSTPayableItem ' + revSGSTPayableItem);
					log.debug("Inside if search record found.", 'revCGSTPurchaseItem ' + revCGSTPurchaseItem + ' revCGSTPayableItem ' + revCGSTPayableItem);
					log.debug("Inside if search record found.", 'revIGSTPurchaseItem ' + revIGSTPurchaseItem + ' revIGSTPayableItem ' + revIGSTPayableItem + ' revTaxCode ' + revTaxCode);

				}

				//Variables declared to store the rates respectively.
				var cgstRate, sgstRate, igstRate;

				//Variable declared to flag gst type as inter or intra. this is done to avoid hard-code of inter and intra id's.
				var isIGST = 'F';

				//Load Tax-group to get the "cgst and sgst" or "igst" rates for reversal calculation.
				var loadTaxGroup = record.load({
					type: record.Type.TAX_GROUP,
					id: taxCodeId
				});

				var taxLineItems = loadTaxGroup.getLineCount({
					sublistId: 'taxitem'
				});

				for (var t = 0; t < taxLineItems; t++) {

					//Get the tax name and split to compare the gst type and get the rate accordingly.
					var taxname = loadTaxGroup.getSublistValue({
						sublistId: 'taxitem',
						fieldId: 'taxtype',
						line: t
					});

					taxname = taxname.split("_");
					taxname = taxname.toLocaleString().toLowerCase().split(',');

					if (taxname.indexOf(cgst) >= 0) {

						cgstRate = loadTaxGroup.getSublistValue({
							sublistId: 'taxitem',
							fieldId: 'rate',
							line: t
						});
						log.debug('cgstRate', cgstRate);

					}

					if (taxname.indexOf(sgst) >= 0) {

						sgstRate = loadTaxGroup.getSublistValue({
							sublistId: 'taxitem',
							fieldId: 'rate',
							line: t
						});
						log.debug('sgstRate', sgstRate);

					}

					if (taxname.indexOf(igst) >= 0) {

						isIGST = 'T';
						igstRate = loadTaxGroup.getSublistValue({
							sublistId: 'taxitem',
							fieldId: 'rate',
							line: t
						});
						log.debug('igstRate', igstRate);


					}

				}

				log.debug('isIGST', isIGST);

				//Calculate CGST, SGST and IGST amount to be set on the line.
				//Total is calculated of all the lines to be set on total CGST, SGST and IGST fields for print.
				if (isIGST == 'T' || isIGST == "T") {

					var purchaseAmountigst = getAmount * (igstRate / 100);
					var negativeAmountigst = -purchaseAmountigst;

					totalIgstAmount = Number(totalIgstAmount) + Number(purchaseAmountigst);
					log.debug("totalIgstAmount:- " + totalIgstAmount);

				} else if (isIGST == 'F' || isIGST == "F") {

					var purchaseAmountcgst = getAmount * (cgstRate / 100);
					var negativeAmountcgst = -purchaseAmountcgst;

					var purchaseAmountsgst = getAmount * (sgstRate / 100);
					var negativeAmountsgst = -purchaseAmountsgst;

					totalCgstAmount = Number(totalCgstAmount) + Number(purchaseAmountcgst);
					totalSgstAmount = Number(totalSgstAmount) + Number(purchaseAmountsgst);

				}

				log.debug('isReversal', isReversal);

				//If reversal check-box is checked the reversal calculations to be done.
				if (isReversal) {

					billObject.setSublistValue({
						sublistId: 'item',
						fieldId: 'taxcode',
						line: i,
						value: revTaxCode
					});

					//If isIGST is true - GST type is considered as Inter.
					if (isIGST == 'T' || isIGST == "T") {

						log.debug('tempCountItem', tempCountItem);
						log.debug('tempCountItem+1', tempCountItem + 1);

						//Set IGST Purchase Item and Calculated IGST Rate and Amount.
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'item',
							line: tempCountItem + 1,
							value: revIGSTPurchaseItem
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'rate',
							line: tempCountItem + 1,
							value: purchaseAmountigst
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'amount',
							line: tempCountItem + 1,
							value: purchaseAmountigst
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'taxcode',
							line: tempCountItem + 1,
							value: revTaxCode
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_reversal_apply',
							line: tempCountItem + 1,
							value: true
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_igstrate',
							line: tempCountItem + 1,
							value: igstRate
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_igstamount',
							line: tempCountItem + 1,
							value: purchaseAmountigst
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_cgstrate',
							line: tempCountItem + 1,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_cgstamount',
							line: tempCountItem + 1,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_sgstrate',
							line: tempCountItem + 1,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_sgstamount',
							line: tempCountItem + 1,
							value: 0
						});

						//Set IGST Payable Item and Calculated Negative IGST Rate and Amount.
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'item',
							line: tempCountItem + 2,
							value: revIGSTPayableItem
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'rate',
							line: tempCountItem + 2,
							value: negativeAmountigst
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'amount',
							line: tempCountItem + 2,
							value: negativeAmountigst
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'taxcode',
							line: tempCountItem + 2,
							value: revTaxCode
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_reversal_apply',
							line: tempCountItem + 2,
							value: true
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_igstrate',
							line: tempCountItem + 2,
							value: igstRate
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_igstamount',
							line: tempCountItem + 2,
							value: purchaseAmountigst
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_cgstrate',
							line: tempCountItem + 2,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_cgstamount',
							line: tempCountItem + 2,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_sgstrate',
							line: tempCountItem + 2,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_sgstamount',
							line: tempCountItem + 2,
							value: 0
						});

						tempCountItem = tempCountItem + 2;

					}
					//If isIGST is false - GST Type is considered as Intra.
					else if (isIGST == 'F' || isIGST == "F") {

						//Set SGST Purchase Item and Calculated SGST Rate and Amount.
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'item',
							line: tempCountItem + 1,
							value: revSGSTPurchaseItem
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'rate',
							line: tempCountItem + 1,
							value: purchaseAmountsgst
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'amount',
							line: tempCountItem + 1,
							value: purchaseAmountsgst
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'taxcode',
							line: tempCountItem + 1,
							value: revTaxCode
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_sgstrate',
							line: tempCountItem + 1,
							value: sgstRate
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_sgstamount',
							line: tempCountItem + 1,
							value: purchaseAmountsgst
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_cgstrate',
							line: tempCountItem + 1,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_cgstamount',
							line: tempCountItem + 1,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_igstrate',
							line: tempCountItem + 1,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_igstamount',
							line: tempCountItem + 1,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_reversal_apply',
							line: tempCountItem + 1,
							value: true
						});

						//Set SGST Payable Item and Calculated Negative SGST Rate and Amount.
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'item',
							line: tempCountItem + 2,
							value: revSGSTPayableItem
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'rate',
							line: tempCountItem + 2,
							value: negativeAmountsgst
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'amount',
							line: tempCountItem + 2,
							value: negativeAmountsgst
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'taxcode',
							line: tempCountItem + 2,
							value: revTaxCode
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_sgstrate',
							line: tempCountItem + 2,
							value: sgstRate
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_sgstamount',
							line: tempCountItem + 2,
							value: purchaseAmountsgst
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_cgstrate',
							line: tempCountItem + 2,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_cgstamount',
							line: tempCountItem + 2,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_igstrate',
							line: tempCountItem + 2,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_igstamount',
							line: tempCountItem + 2,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_reversal_apply',
							line: tempCountItem + 2,
							value: true
						});

						//Set CGST Purchase Item and Calculated CGST Rate and Amount.
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'item',
							line: tempCountItem + 3,
							value: revCGSTPurchaseItem
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'rate',
							line: tempCountItem + 3,
							value: purchaseAmountcgst
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'amount',
							line: tempCountItem + 3,
							value: purchaseAmountcgst
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'taxcode',
							line: tempCountItem + 3,
							value: revTaxCode
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_cgstrate',
							line: tempCountItem + 3,
							value: cgstRate
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_cgstamount',
							line: tempCountItem + 3,
							value: purchaseAmountcgst
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_sgstrate',
							line: tempCountItem + 3,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_sgstamount',
							line: tempCountItem + 3,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_igstrate',
							line: tempCountItem + 3,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_igstamount',
							line: tempCountItem + 3,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_reversal_apply',
							line: tempCountItem + 3,
							value: true
						});

						//Set CGST Payable Item and Calculated Negative CGST Rate and Amount.
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'item',
							line: tempCountItem + 4,
							value: revCGSTPayableItem
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'rate',
							line: tempCountItem + 4,
							value: negativeAmountcgst
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'amount',
							line: tempCountItem + 4,
							value: negativeAmountcgst
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'taxcode',
							line: tempCountItem + 4,
							value: revTaxCode
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_cgstrate',
							line: tempCountItem + 4,
							value: cgstRate
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_cgstamount',
							line: tempCountItem + 4,
							value: purchaseAmountcgst
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_sgstrate',
							line: tempCountItem + 4,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_sgstamount',
							line: tempCountItem + 4,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_igstrate',
							line: tempCountItem + 4,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_igstamount',
							line: tempCountItem + 4,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_reversal_apply',
							line: tempCountItem + 4,
							value: true
						});

						tempCountItem = tempCountItem + 4;

					}

				}
				//Else set the tax-code id received as is to the tax code field.
				else {

					if (isIGST == 'T' || isIGST == "T") {

						//Set the IGST rate and calculated amount for the item selected.
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'taxcode',
							line: i,
							value: taxCodeId
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_igstrate',
							line: i,
							value: igstRate
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_igstamount',
							line: i,
							value: purchaseAmountigst
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_cgstrate',
							line: i,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_cgstamount',
							line: i,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_sgstrate',
							line: i,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_sgstamount',
							line: i,
							value: 0
						});

					} else if (isIGST == 'F' || isIGST == "F") {

						//Set the cgst and sgst rate and amount for the item selected.
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'taxcode',
							line: i,
							value: taxCodeId
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_cgstrate',
							line: i,
							value: cgstRate
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_cgstamount',
							line: i,
							value: purchaseAmountcgst
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_sgstrate',
							line: i,
							value: sgstRate
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_sgstamount',
							line: i,
							value: purchaseAmountsgst
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_igstrate',
							line: i,
							value: 0
						});
						billObject.setSublistValue({
							sublistId: 'item',
							fieldId: 'custcol_gst_igstamount',
							line: i,
							value: 0
						});

					}

				}

			}

			//Set Total CGST, SGST and IGST in body fields.
			if (isIGST == 'F' || isIGST == "F") {

				billObject.setValue({
					fieldId: 'custbody_gst_totalcgst',
					value: totalCgstAmount
				});
				billObject.setValue({
					fieldId: 'custbody_gst_totalsgst',
					value: totalSgstAmount
				});
				billObject.setValue({
					fieldId: 'custbody_gst_totaligst',
					value: 0
				});

			} else if (isIGST == 'T' || isIGST == "T") {

				billObject.setValue({
					fieldId: 'custbody_gst_totaligst',
					value: totalIgstAmount
				});
				billObject.setValue({
					fieldId: 'custbody_gst_totalcgst',
					value: 0
				});
				billObject.setValue({
					fieldId: 'custbody_gst_totalsgst',
					value: 0
				});
			}

		}

	}

	/**
	 * Function definition to be triggered before record is loaded.
	 *
	 * @param {Object} scriptContext
	 * @param {Record} scriptContext.newRecord - New record
	 * @param {Record} scriptContext.oldRecord - Old record
	 * @param {string} scriptContext.type - Trigger type
	 * @Since 2015.2
	 */
	function afterSubmit(scriptContext) {

	}

	return {
		beforeLoad: beforeLoad,
		beforeSubmit: beforeSubmit,
		afterSubmit: afterSubmit
	};

});