/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * @Author 
 */
define(['N/currentRecord', 'N/record', 'N/search', 'N/runtime', 'N/log'],

    function(currentRecord, record, search, runtime, log) {
        var gstNumber;
        var intra = 1;
        var inter = 2;
        var getIndiaSubsidiary;

        function pageInit(scriptContext) {
            var currentRecordObj = scriptContext.currentRecord;
            var subsidiary = currentRecordObj.getValue({
                fieldId: 'subsidiary'
            });

            var isGSTType = currentRecordObj.getValue({
                fieldId: 'custbody_gst_gsttype'
            });
            var scriptObj = runtime.getCurrentScript();
            var getIndiaSubsidiary = scriptObj.getParameter({
                name: 'custscript_gst_po_cs_indiasubsidiary'
            });

            // if (subsidiary == getIndiaSubsidiary) {
            if (getIndiaSubsidiary && (getIndiaSubsidiary == subsidiary)) {
                if (scriptContext.mode == 'copy') {

                    var lineItemCount = currentRecordObj.getLineCount({
                        sublistId: 'item'
                    });

                    for (var i = 0; i < lineItemCount; i++) {
                        currentRecordObj.selectLine({
                            sublistId: 'item',
                            line: i
                        });

                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_gst_sgstrate',
                            value: ''
                        });

                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_gst_cgstrate',
                            value: ''
                        });

                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_gst_igstrate',
                            value: ''
                        });

                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_gst_igstamount',
                            value: ''
                        });

                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_gst_sgstamount',
                            value: ''
                        });

                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_gst_cgstamount',
                            value: ''
                        });

                        currentRecordObj.commitLine({
                            sublistId: 'item'
                        });

                    }

                    return;

                }

                var customerId = currentRecordObj.getValue({
                    fieldId: 'entity'
                });
                var shippingAddress = currentRecordObj.getValue({
                    fieldId: 'billaddresslist' //'shipaddresslist'
                });

                //alert("shippingAddress pageInit:- " +shippingAddress);

                if (scriptContext.mode != 'edit' && scriptContext.mode != 'xedit')
                    setCustomerGstNumber(customerId, subsidiary, shippingAddress, currentRecordObj);

            }

            return true;

        }

        var isGSTType;

        //Function to set the gst number and gst type based on the change of ship-address and location
        function fieldChanged(scriptContext) {

            var currentRecordObj = scriptContext.currentRecord;
            var subsidiary = currentRecordObj.getValue({
                fieldId: 'subsidiary'
            });
            var scriptObj = runtime.getCurrentScript();
            var getIndiaSubsidiary = scriptObj.getParameter({
                name: 'custscript_gst_po_cs_indiasubsidiary'
            });
            var intra = 1;
            var inter = 2;


            //Check if customer's subsidiary matches India Subsidiary. If matched then check the fields change condition's.
            //if (subsidiary == getIndiaSubsidiary) {
            if (getIndiaSubsidiary && (getIndiaSubsidiary == subsidiary)) {
                //alert(isGSTType);

                if (scriptContext.fieldId == "location" && (scriptContext.sublistId == null || scriptContext.sublistId == 'null')) {

                    isGSTType = currentRecordObj.getValue({
                        fieldId: 'custbody_gst_gsttype'
                    });
                    var location = currentRecordObj.getValue({
                        fieldId: 'location'
                    });

                    if (!location) {
                        currentRecordObj.setValue({
                            fieldId: 'custbody_gst_locationregno',
                            value: ''
                        });

                    } else {

                        //Load location to get the state and gst number from location address.
                        var locationRecordObj = record.load({
                            type: record.Type.LOCATION,
                            id: location
                        })

                        var subrec = locationRecordObj.getSubrecord({
                            fieldId: 'mainaddress'
                        });
                        var companyState = subrec.getText({
                            fieldId: 'custrecord_state_gst'
                        });
                        var locationGstNumber = subrec.getValue({
                            fieldId: 'custrecord_gst_nocustomeraddr'
                        });

                        currentRecordObj.setValue({
                            fieldId: 'custbody_gst_locationregno',
                            value: locationGstNumber,

                        });

                        var customerGstNumber = currentRecordObj.getValue({
                            fieldId: 'custbody_gst_customerregno'
                        });


                        //If customer gst number not found.
                        if (!customerGstNumber) {

                            var getCustGSTType = currentRecordObj.getText({
                                fieldId: 'custbody_gst_destinationstate'
                            });

                            locationGstNumber = locationGstNumber.toString();
                            locationGstNumber = locationGstNumber.substr(0, 2);


                            //If location state and customer's address state matches set gst type to intra.
                            if (locationGstNumber && (Number(locationGstNumber) == Number(getCustGSTType))) {

                                currentRecordObj.setValue({

                                    fieldId: 'custbody_gst_gsttype',
                                    value: intra,

                                });

                            }
                            //If location state and customer's address state does not matches set gst type to inter.
                            else {

                                currentRecordObj.setValue({
                                    fieldId: 'custbody_gst_gsttype',
                                    value: inter,
                                });

                            }

                        } else {
                            var companyGstNumber = currentRecordObj.getValue({
                                fieldId: 'custbody_gst_locationregno'
                            });
                            var customerGstNumber = currentRecordObj.getValue({
                                fieldId: 'custbody_gst_customerregno'
                            });


                            //If both the gst number's i.e. of customer and company are there then get the gst type.
                            if (companyGstNumber && customerGstNumber) {

                                companyGstNumber = companyGstNumber.toString();
                                companyGstNumber = companyGstNumber.substr(0, 2);

                                customerGstNumber = customerGstNumber.toString();
                                customerGstNumber = customerGstNumber.substr(0, 2);

                                if (companyGstNumber && (Number(companyGstNumber) == Number(customerGstNumber))) {

                                    currentRecordObj.setValue({
                                        fieldId: 'custbody_gst_gsttype',
                                        value: intra,

                                    });

                                } else {

                                    currentRecordObj.setValue({
                                        fieldId: 'custbody_gst_gsttype',
                                        value: inter,
                                    });

                                }
                            }
                            //If Location Gst Number is blank then Gst Type: Inter...
                            else {
                                currentRecordObj.setValue({
                                    fieldId: 'custbody_gst_gsttype',
                                    value: inter,
                                });
                            }
                            /*else {

                                companyGstNumber = companyGstNumber.toString();
                                companyGstNumber = companyGstNumber.substr(0, 2);

                                customerGstNumber = customerGstNumber.toString();
                                customerGstNumber = customerGstNumber.substr(0, 2);

                                if ((Number(companyGstNumber) == Number(customerGstNumber))) {

                                    currentRecordObj.setValue({
                                        fieldId: 'custbody_gst_gsttype',
                                        value: intra,

                                    });

                                }
								else {

                                    currentRecordObj.setValue({
                                        fieldId: 'custbody_gst_gsttype',
                                        value: inter,
                                    });

                                }
                            }*/
                        }
                    }

                    currentRecordObj.setValue({
                        fieldId: 'custbody_gst_total_cgst',
                        value: '',

                    });
                    currentRecordObj.setValue({
                        fieldId: 'custbody_gst_totaligst',
                        value: '',

                    });
                    currentRecordObj.setValue({
                        fieldId: 'custbody_gst_totalsgst',
                        value: '',

                    });

                }

                if (scriptContext.fieldId == "billaddresslist") {

                    var inter = 2;
                    var intra = 1;

                    isGSTType = currentRecordObj.getValue({
                        fieldId: 'custbody_gst_gsttype'
                    });
                    var customerId = currentRecordObj.getValue({
                        fieldId: 'entity'
                    });
                    var shippingAddress = Number(currentRecordObj.getValue({
                        fieldId: 'billaddresslist'
                    }));

                    var locationText = currentRecordObj.getText({
                        fieldId: 'location'
                    });
                    var destinationLocation = currentRecordObj.getText({
                        fieldId: 'custbody_gst_destinationstate'
                    });

                    var customerRecord = record.load({
                        type: record.Type.VENDOR,
                        id: customerId
                    });

                    var addressDetailsObject = getGstOnAddress(customerRecord, shippingAddress);

                    var state = addressDetailsObject.state;

                    currentRecordObj.setValue({

                        fieldId: 'custbody_gst_customerregno',
                        value: addressDetailsObject.gstNumber,

                    });

                    currentRecordObj.setValue({
                        fieldId: 'custbody_gst_destinationstate',
                        value: state,
                        ignoreFieldChange: true,
                        fireSlavingSync: true
                    });

                    var gstRegistrationNumber = currentRecordObj.getValue({
                        fieldId: 'custbody_gst_locationregno'
                    });

                    gstRegistrationNumber = gstRegistrationNumber.toString();
                    gstRegistrationNumber = gstRegistrationNumber.substr(0, 2);

                    var custGSTNumber = addressDetailsObject.gstNumber;
                    custGSTNumber = custGSTNumber.toString();
                    custGSTNumber = custGSTNumber.substr(0, 2);

                    if (Number(gstRegistrationNumber) == Number(custGSTNumber)) {

                        currentRecordObj.setValue({
                            fieldId: 'custbody_gst_gsttype',
                            value: intra,

                        });

                    } else {

                        currentRecordObj.setValue({
                            fieldId: 'custbody_gst_gsttype',
                            value: inter,

                        });

                    }

                    currentRecordObj.setValue({
                        fieldId: 'custbody_gst_total_cgst',
                        value: '',

                    });

                    currentRecordObj.setValue({
                        fieldId: 'custbody_gst_totaligst',
                        value: '',

                    });

                    currentRecordObj.setValue({
                        fieldId: 'custbody_gst_totalsgst',
                        value: '',

                    });

                }

                if (scriptContext.sublistId == 'item' && scriptContext.fieldId == 'item') {

                    var location = currentRecordObj.getValue({
                        fieldId: 'location'
                    });

                    if (location == '' || location == null) {

                        var itemId = currentRecordObj.getCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'item'
                        });

                        if (itemId != '' && itemId != null) {

                            alert('Please select a location first.');

                            currentRecordObj.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                value: '',
                                ignoreFieldChange: false
                            });

                            return false;

                        }
                    }
                }

                if (scriptContext.sublistId == 'item' && scriptContext.fieldId == 'custcol_gst_reversal_apply') {

                    var itemId = currentRecordObj.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item'
                    });
                    getTaxCode = search.lookupFields({
                        type: 'item',
                        id: itemId,
                        columns: 'custitem_gst_itemschedule'
                    });

                    if (getTaxCode.custitem_gst_itemschedule[0]) {
                        var scheduleId = getTaxCode.custitem_gst_itemschedule[0].value;
                    } else {
                        netsuiteAlert('Schedule is not set for this particular item');
                        return;
                    }

                    var shipToState = currentRecordObj.getValue({
                        fieldId: 'custbody_gst_destinationstate'
                    });
                    var gstType = currentRecordObj.getValue({
                        fieldId: 'custbody_gst_gsttype'
                    });

                    var taxCodeFilters = [];
                    var taxCodeColumns = [];

                    taxCodeFilters.push(search.createFilter({
                        name: 'custrecord_gst_type',
                        operator: search.Operator.IS,
                        values: gstType
                    }));

                    //				if(shipToState !=null && shipToState !='')
                    //				{
                    //					if(gstType == intra)
                    //					{
                    //
                    //						taxCodeFilters.push(search.createFilter({
                    //							name : 'custrecord_location_state',
                    //							operator : search.Operator.IS,
                    //							values :  shipToState
                    //						}));
                    //					}
                    //				}

                    taxCodeFilters.push(search.createFilter({
                        name: 'custrecord_gst_item_schedule',
                        operator: search.Operator.IS,
                        values: scheduleId
                    }));

                    taxCodeColumns.push(search.createColumn({
                        name: 'custrecord_gst_tax_code'
                    }));

                    taxCodeColumns.push(search.createColumn({
                        name: 'custrecord_gst_tax_code'
                    }));

                    taxCodeColumns.push(search.createColumn({
                        name: 'custrecord_gst_reversal_taxcode'
                    }));

                    var taxCodeSearch = search.create({
                        "type": "customrecord_gst_tax_code_matrix",
                        "filters": taxCodeFilters,
                        "columns": taxCodeColumns
                    });

                    var arrSearchResults = taxCodeSearch.run().getRange({
                        start: 0,
                        end: 1
                    });
                    var scriptObj = runtime.getCurrentScript();
                    if (arrSearchResults[0]) {
                        var taxCodeInternalId = arrSearchResults[0].getValue('custrecord_gst_tax_code');
                        var reversalTaxCode = arrSearchResults[0].getValue('custrecord_gst_reversal_taxcode');

                    } else {

                        alert('Custom GST tax record for the selected destination state not found');
                        return;
                    }

                    var getApplyvalue = currentRecordObj.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_gst_reversal_apply'
                    });

                    //If check-box not checked set the old tax code.
                    if (!getApplyvalue) {

                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxcode',
                            value: taxCodeInternalId,
                            ignoreFieldChange: false
                        });

                    }
                    //If checked then set the reversal tax code.
                    else {

                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxcode',
                            value: reversalTaxCode,
                            ignoreFieldChange: false
                        });

                    }

                }

                return true;

            }

            return true;

        }

        //To be written
        function postSourcing(scriptContext) {

            var currentRecordObj = currentRecord.get();
            var subsidiary = currentRecordObj.getValue({
                fieldId: 'subsidiary'
            });
            var subsidiary = currentRecordObj.getValue({
                fieldId: 'subsidiary'
            });

            var scriptObj = runtime.getCurrentScript();
            var getIndiaSubsidiary = scriptObj.getParameter({
                name: 'custscript_gst_po_cs_indiasubsidiary'
            });

            //  if (subsidiary == getIndiaSubsidiary) {
            if (getIndiaSubsidiary && (getIndiaSubsidiary == subsidiary)) {
                //			if(scriptContext.fieldId == 'custbody_gst_gsttype' && scriptContext.mode == 'edit') {
                //				
                //				alert('Inside gst type change');
                //				var newGSTType = currentRecordObj.getValue({fieldId: 'custbody_gst_gsttype'});
                //				
                //				if(isGSTType != newGSTType) {
                //					
                //					var getLineCount = currentRecordObj.getLineCount({sublistId: 'item'});
                //					
                //					if(getLineCount > 0) {
                //						
                //						for(var i = 0; i < getLineCount; i++) {
                //							
                //							currentRecordObj.selectLine({
                //								sublistId: 'item',
                //								line: i
                //							});
                //							
                //							currentRecordObj.setCurrentSublistValue({
                //								sublistId: 'item',
                //								fieldId:'custcol_gst_sgstrate',
                //								value:''
                //							});
                //
                //							currentRecordObj.setCurrentSublistValue({
                //								sublistId: 'item',
                //								fieldId:'custcol_gst_cgstrate',
                //								value:''
                //							});
                //
                //							currentRecordObj.setCurrentSublistValue({
                //								sublistId: 'item',
                //								fieldId:'custcol_gst_igstrate',
                //								value:''
                //							});
                //
                //							currentRecordObj.setCurrentSublistValue({
                //								sublistId: 'item',
                //								fieldId:'custcol_gst_igstamount',
                //								value:''
                //							});
                //
                //							currentRecordObj.setCurrentSublistValue({
                //								sublistId: 'item',
                //								fieldId:'custcol_gst_sgstamount',
                //								value:''
                //							});
                //
                //							currentRecordObj.setCurrentSublistValue({
                //								sublistId: 'item',
                //								fieldId:'custcol_gst_cgstamount',
                //								value:''
                //							});
                //
                //							currentRecordObj.commitLine({
                //								sublistId: 'item'
                //							});
                //							
                //						}
                //						
                //					}
                //					
                //				}
                //				
                //			}

                if (scriptContext.sublistId == 'item' && scriptContext.fieldId == 'item') {

                    var myStateCode = currentRecordObj.getValue({
                        fieldId: 'custbody_gst_locationregno'
                    });

                    if (myStateCode != null && myStateCode != '') {
                        myStateCode = myStateCode.substr(0, 2);
                    }

                    var itemId = currentRecordObj.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item'
                    });

                    var getTaxCode;

                    if (itemId) {

                        getTaxCode = search.lookupFields({
                            type: 'item',
                            id: itemId,
                            columns: 'custitem_gst_itemschedule'
                        });

                        if (getTaxCode.custitem_gst_itemschedule[0]) {
                            var scheduleId = getTaxCode.custitem_gst_itemschedule[0].value;
                            //						alert('scheduleId '+scheduleId);
                        } else {

                            alert('Schedule is not set for this particular item');
                            return;
                        }

                        var shipToState = currentRecordObj.getValue({
                            fieldId: 'custbody_gst_destinationstate'
                        });
                        var custgstn = currentRecordObj.getValue({
                            fieldId: 'custbody_gst_customerregno'
                        });
                        var gstType = currentRecordObj.getValue({
                            fieldId: 'custbody_gst_gsttype'
                        });

                        var taxCodeFilters = [];
                        var taxCodeColumns = [];

                        taxCodeFilters.push(search.createFilter({
                            name: 'custrecord_gst_type',
                            operator: search.Operator.IS,
                            values: gstType
                        }));

                        taxCodeFilters.push(search.createFilter({
                            name: 'custrecord_gst_item_schedule',
                            operator: search.Operator.IS,
                            values: scheduleId
                        }));

                        taxCodeColumns.push(search.createColumn({
                            name: 'custrecord_gst_tax_code'
                        }));

                        taxCodeColumns.push(search.createColumn({
                            name: 'custrecord_gst_tax_code'
                        }));

                        var taxCodeSearch = search.create({
                            "type": "customrecord_gst_tax_code_matrix",
                            "filters": taxCodeFilters,
                            "columns": taxCodeColumns
                        });

                        var arrSearchResults = taxCodeSearch.run().getRange({
                            start: 0,
                            end: 1
                        });
                        var scriptObj = runtime.getCurrentScript();
                        var taxCodeInternalId;
                        if (arrSearchResults) {

                            taxCodeInternalId = arrSearchResults[0].getValue('custrecord_gst_tax_code');
                        } else {

                            alert('Custom GST tax record for the selected destination state not found');
                            return;
                        }

                        //					alert('taxCodeInternalId '+taxCodeInternalId);
                        taxCodeInternalId = Number(taxCodeInternalId);

                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxcode',
                            value: taxCodeInternalId,
                            ignoreFieldChange: false
                        });

                        return true;

                    }

                    return true;
                }

                if (scriptContext.sublistId == 'expense' && scriptContext.fieldId == 'account') {

                    var accountId = currentRecordObj.getCurrentSublistValue({
                        sublistId: 'expense',
                        fieldId: 'account'
                    });

                    var getTaxCode;

                    if (accountId) {

                        var scheduleId = 1;

                        var gstType = currentRecordObj.getValue({
                            fieldId: 'custbody_gst_gsttype'
                        });

                        //					getTaxCode = search.lookupFields({
                        //						type : 'item',
                        //						id   :  itemId,
                        //						columns : 'custitem_gst_itemschedule'
                        //					});
                        //					
                        //					if(getTaxCode.custitem_gst_itemschedule[0])
                        //					{
                        //						var scheduleId = getTaxCode.custitem_gst_itemschedule[0].value;
                        ////						alert('scheduleId '+scheduleId);
                        //					}

                        var taxCodeFilters = [];
                        var taxCodeColumns = [];

                        taxCodeFilters.push(search.createFilter({
                            name: 'custrecord_gst_type',
                            operator: search.Operator.IS,
                            values: gstType
                        }));

                        taxCodeFilters.push(search.createFilter({
                            name: 'custrecord_gst_item_schedule',
                            operator: search.Operator.IS,
                            values: scheduleId
                        }));

                        taxCodeColumns.push(search.createColumn({
                            name: 'custrecord_gst_tax_code'
                        }));

                        taxCodeColumns.push(search.createColumn({
                            name: 'custrecord_gst_tax_code'
                        }));

                        var taxCodeSearch = search.create({
                            "type": "customrecord_gst_tax_code_matrix",
                            "filters": taxCodeFilters,
                            "columns": taxCodeColumns
                        });

                        var arrSearchResults = taxCodeSearch.run().getRange({
                            start: 0,
                            end: 1
                        });
                        var scriptObj = runtime.getCurrentScript();

                        if (arrSearchResults[0]) {
                            var taxCodeInternalId = arrSearchResults[0].getValue('custrecord_gst_tax_code')

                        } else {

                            alert('Custom GST tax record for the selected destination state not found');
                            return;
                        }

                        currentRecordObj.setCurrentSublistValue({
                            sublistId: 'expense',
                            fieldId: 'taxcode',
                            value: taxCodeInternalId,
                            ignoreFieldChange: false
                        });
                    }
                }

                return true;
            }

            return true;
        }


        //Function to get the gst number from the address book.
        function getGstOnAddress(customerRecord, shippingAddress) {

            //Initialize variables to return the values from the address book.
            var customerGstID;
            var state;

            //Get the sublist id count.
            var lineCount = customerRecord.getLineCount({
                sublistId: 'addressbook'
            });
            //  alert("lineCount "+lineCount);
            // alert("shippingAddress "+shippingAddress);
            if (shippingAddress != null && shippingAddress != '' && shippingAddress != undefined) {

                for (var i = 0; i < lineCount; i++) {

                    var addressId = customerRecord.getSublistValue({
                        sublistId: 'addressbook',
                        fieldId: 'id',
                        line: i
                    });

                    //   alert("shippingAddress  " +Number(shippingAddress)+ "addressId " +Number(addressId));

                    //If the address book id on the current record matches the address line on the customer the get the GST Number and State.
                    if (Number(shippingAddress) == Number(addressId)) {
                        var addressSubrecord = customerRecord.getSublistSubrecord({
                            sublistId: 'addressbook',
                            fieldId: 'addressbookaddress',
                            line: i
                        });

                        customerGstID = addressSubrecord.getValue({
                            fieldId: 'custrecord_gst_nocustomeraddr'
                        });
                        //   alert("getGstOnAddress customerGstID " +customerGstID);

                        state = addressSubrecord.getValue({
                            fieldId: 'custrecord_gst_addressstatecode'
                        });
                        //  alert("getGstOnAddress state" +state);

                    }

                }

            }
            //If the shipping address is empty then state and gst number are defaulted to the 1st line address book values.
            else {
                var addressId = customerRecord.getSublistValue({
                    sublistId: 'addressbook',
                    fieldId: 'id',
                    line: 0
                });

                var addressSubrecord = customerRecord.getSublistSubrecord({
                    sublistId: 'addressbook',
                    fieldId: 'addressbookaddress',
                    line: 0
                });

                customerGstID = addressSubrecord.getValue({
                    fieldId: 'custrecord_gst_nocustomeraddr'
                });

                //    alert("else customerGstID " +customerGstID);

                state = addressSubrecord.getValue({
                    fieldId: 'custrecord_gst_addressstatecode'
                });
                //  alert(" else state "+state);

            }

            var addressDetailObj = {
                'gstNumber': customerGstID,
                'state': state
            }

            return addressDetailObj;
        }

        //Function to get the gst type based on the state code mapping.
        function getGstType(sourceGstNumber, destinationGst, state, locationText, destinationLocation) {

            var intra = 1;
            var inter = 2;

            if (destinationGst == null || destinationGst == '') {
                return inter;
            } else {
                sourceGstNumber = sourceGstNumber.toString();
                sourceGstNumber = sourceGstNumber.substr(0, 2);
                if (!destinationGst) {
                    var stateFilter = [];
                    var stateColumn = [];

                    stateFilter.push(search.createFilter({
                        name: 'custrecord_state',
                        operator: search.Operator.IS,
                        values: state
                    }));

                    taxCodeColumns.push(search.createColumn({
                        name: 'custrecord_state_code'
                    }));

                    var stateRecordSearch = search.create({
                        "type": "customrecord_state_code_mapping",
                        "filters": stateFilter,
                        "columns": stateColumn
                    });

                    stateRecordSearch = stateRecordSearch.run().getRange({
                        start: 0,
                        end: 1
                    });
                    if (stateRecordSearch[0]) {
                        var stateCode = arrSearchResults[0].getValue('custrecord_gst_tax_code')
                        destinationGst = stateCode;
                        //console.log(taxCodeInternalId);
                    }
                } else {

                    destinationGst = destinationGst.toString();
                    destinationGst = destinationGst.substr(0, 2);

                }

                if (Number(sourceGstNumber) == Number(destinationGst)) {
                    return intra;
                } else {

                    return inter;
                }
            }
        }

        /**
         * 
         * @param customerId
         * @param subsidiary
         * @param shippingAddress
         * @param currentRecordObj
         *  sets customer and company gst number
         */
        function setCustomerGstNumber(customerId, subsidiary, shippingAddress, currentRecordObj) {

            if (customerId && subsidiary) {

                var intra = 1;
                var inter = 2;

                var rec = record.load({
                    type: record.Type.VENDOR,
                    id: customerId
                });
                var addressObject = getGstOnAddress(rec, shippingAddress);

                var state = addressObject.state;

                if (addressObject.gstNumber) {

                    currentRecordObj.setValue({
                        fieldId: 'custbody_gst_customerregno',
                        value: addressObject.gstNumber,
                        ignoreFieldChange: true,
                        fireSlavingSync: true
                    });

                }

                currentRecordObj.setValue({
                    fieldId: 'custbody_gst_destinationstate',
                    value: state,
                    ignoreFieldChange: true,
                    fireSlavingSync: true
                });

            }

        }

        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            postSourcing: postSourcing,

        };

    });