/* eslint-disable react/no-unescaped-entities */
import React, { useEffect, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";
import { BsFileEarmarkArrowUp } from "react-icons/bs";
import { useLocalContext } from "../context/context";
import db, { auth, storage } from "../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { Button, Spin, Row, Col, Tooltip } from "antd";
import { v4 as uuidv4 } from "uuid";
import { useParams } from "react-router-dom";
import { GoogleOutlined } from "@ant-design/icons";
import { AiOutlineDownload } from "react-icons/ai";
import jsPDF from "jspdf"; // Import jsPDF
import html2pdf from "html2pdf.js";
import html2canvas from "html2canvas";

const Chat = ({ isSidebarOpen }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [inputText, setInputText] = useState("");
  const [selectedButton, setSelectedButton] = useState("Patient History");
  const [uploading, setUploading] = useState(false);
  const [rewrittenText, setRewrittenText] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);
  const { user, setUser } = useLocalContext();
  const [loadingDiv, setLoadingDiv] = useState(false);
  const rewrittenTextRef = useRef();
  const { id } = useParams();
  const modalRef = useRef(null); // Ref for the modal
  const queryPrompt = `{
      "Instructions": {
          "Introduction": "You are an AI clinician summarizing patient information from the provided narrative. Your goal is to produce a structured, clinician-oriented discharge summary and care plan to support high-quality patient care and optimal reimbursement. Follow the steps below:",
          "Steps": {
              "ICD-10 Code Identification and Assignment": {
                  "Description": "Identify all relevant diagnoses mentioned in the narrative and assign the most specific ICD-10 codes possible. If you cannot confidently assign a code, note 'ICD-10 code not provided.' Determine the primary diagnosis (the one most relevant to home health services and most likely to support optimal reimbursement). List secondary diagnoses that further justify or support skilled services and reimbursement."
              },
              "Medications Linked to ICD-10 Codes": {
                  "Description": "Extract all medications from the narrative. For each medication, assign the ICD-10 code(s) of the condition(s) it is intended to treat or manage. If unsure, note 'ICD-10 code not provided.' Ensure that these linkages support the medical necessity of treatments and tie into the chosen primary and secondary diagnoses."
              },
              "Formatting and Content Requirements": {
                  "Description": "Use the exact headings provided in the template below. If any information is not available, write 'Not available.' If data is contradictory or unclear, write 'Conflicting data provided.' Use professional medical terminology and maintain a clinician-facing tone. Include details needed for OASIS and Pre-Claim Review (PCR) documentation."
              },
              "Reimbursement and Documentation": {
                  "Description": "After listing all potential ICD-10 codes, clearly identify which code is primary and which are secondary to optimize reimbursement potential. Highlight any skilled interventions (e.g., wound care, complex medication management) supported by the listed diagnoses and linked medications. Provide OASIS-critical details (ADLs, mobility, cognitive function, wound care specifics) and ensure that documentation supports the necessity of skilled home health services. At the end of the summary, list potential Home Health Billing Codes that align with the patient’s conditions and services required."
              },
              "Final Check": {
                  "Description": "Confirm all sections are complete.Verify that ICD-10 codes are assigned for each identified condition and link to each medication if possible. Ensure that your primary and secondary diagnosis allign with maximum appropriate reimbusment.Include potential health billing codes for example (eg, G0299 for RN,G0159 for PT) at the end"
              }
          }
      },
      "Required Format": {
          "Patient Information": {
              "Name": "[Patient’s full name]",
              "Date of Birth": "[MM/DD/YYYY]",
              "Gender": "[Patient’s gender]",
              "Medicare/Insurance ID": "[ID number]",
              "Primary Care Physician": "[Name]",
              "Emergency Contact": "[Name, Phone]"
          },
          "Hospital Discharge Information": {
              "Hospital Name": "[Name of the hospital]",
              "Date of Admission": "[MM/DD/YYYY]",
              "Date of Discharge": "[MM/DD/YYYY]",
              "Reason for Admission": "[Reason provided]",
              "Discharge Diagnosis": "[Final discharge diagnoses from the narrative]"
          },
          "ICD-10 Coding for Reimbursement": {
              "Primary Diagnosis": "[The single condition most relevant to home health services and optimal reimbursement]",
              "Secondary Diagnoses(ICD-10 codes)": "[Other relevant diagnoses and codes]"
          },
          "Discharge Summary": {
              "Overview": "Provide a brief overview of the hospital stay, treatments, and the patient’s condition at discharge."
          },
          "Medical History": {
              "Chronic Conditions": "[List ongoing conditions and ICD-10 codes if determined]",
              "Surgical History": "[List surgeries with dates if available]",
              "Allergies": "[List allergies or 'No known allergies']"
          },
          "Lab and Diagnostic Test Results": {
              "Significant Lab Results": "[Abnormal values, trends]",
              "Imaging/Diagnostics": "[Key findings from imaging studies]"
          },
          "Medications Linked to ICD-10 Codes": {
              "Format": "Medication Name | Dosage | Frequency | Route | Associated ICD-10 Code(s) For each medication,assign ICD-10 codes that justify its use(e.g, Metformin → E11.9 for Type 2 Diabetes Mellitus). If unsure, note “ICD-10 code not provided."
          },
          "Changes in medications during hospital stay": {
              "(State any aditions":"discontinuations,or dosage adjustments)"
          },
          "Treatment and Procedures": {
              "Key Procedures": "[List significant procedures and outcomes]",
              "Wound Care": "[Describe wounds, their ICD-10 codes if relevant (e.g., pressure ulcer codes), and care provided]"
          },
          "Progress Notes from the Clinicians": "[Summarize notes supporting skilled care need and complexity]",
          "Functional Status at Discharge": {
              "Mobility": "[e.g., independent, requires assistance]",
              "ADLs": "[Detail assistance needed for bathing, dressing, feeding, etc.]",
              "Cognitive Function": "[Orientation, memory, ability to follow instructions]"
          },
          "Vital Signs at Discharge": {
              "Temperature": "[Value and unit]",
              "Pulse": "[Value/min]",
              "Respiration Rate": "[Value/min]",
              "Blood Pressure": "[Systolic/Diastolic mmHg]",
              "Oxygen Saturation": "[Value and if on room air or O2]"
          },
          "Discharge Instructions and Follow-Up Care Instructions": {
              "Key Instructions": "[Patient/family instructions]",
              "Dietary Restrictions": "[If any]",
              "Activity Restrictions": "[If any]",
              "Follow-Up Appointments": "[Dates, providers, locations]"
          },
          "Short-Term and Long-Term Goals (for OASIS)": "[Set measurable goals for ADLs, wound healing, medication adherence, etc.]",
          "OASIS Considerations": "Provide detail on functional and clinical findings that directly inform OASIS scoring.",
          "PCR (Pre-Claim Review) Documentation": {
              "Skilled Interventions": "Document all skilled interventions and care coordination to justify the need for skilled home health services and support reimbursement."
          },
          "Compliance and Reimbursement Considerations": {
              "Description": "Ensure all documentation shows medical necessity, adherence to the plan of care, and supports compliance with Medicare and insurance requirements."
          },
          "Potential Home Health Billing Codes": {
              "Suggested Codes": "List relevant billing codes suggested by the patient’s needs (e.g., G0299 for skilled nursing, G0159 for PT, G0158 for OT, G0156 for HHA). If none available, note 'Not available.'"
          },
          "Final Check Before Submission": {
              "Medication Linkage": "Confirm that each medication is linked to an ICD-10 code if possible.",
              "Code Optimization": "Verify that the primary and secondary ICD-10 codes are chosen to optimize reimbursement.",
              "Completeness": "Ensure all required details are present and clearly documented. Present the summary as instructed."
          }
      }
  } . the response should be in the json format using the above format. I dont want to see three slashes and json text at either start or finish I just want clean json response.
  `;

  //   const queryPrompt = `{
  //   "Purpose and Overview": {
  //     "Introduction": "You are an AI clinician summarizing patient information from the provided narrative. Your goal is to produce a structured, clinician-oriented discharge summary and care plan to support high-quality patient care and optimal reimbursement. Follow the steps below:",
  //     "Steps": {
  //       "ICD-10 Code Identification and Assignment": {
  //         "Description": "Identify all relevant diagnoses mentioned in the narrative and assign the most specific ICD-10 codes possible. If you cannot confidently assign a code, note 'ICD-10 code not provided.' Determine the primary diagnosis (the one most relevant to home health services and most likely to support optimal reimbursement). List secondary diagnoses that further justify or support skilled services and reimbursement."
  //       },
  //       "Medications Linked to ICD-10 Codes": {
  //         "Description": "Extract all medications from the narrative. For each medication, assign the ICD-10 code(s) of the condition(s) it is intended to treat or manage. If unsure, note 'ICD-10 code not provided.' Ensure that these linkages support the medical necessity of treatments and tie into the chosen primary and secondary diagnoses."
  //       },
  //       "Formatting and Content Requirements": {
  //         "Description": "Use the exact headings provided in the template below. If any information is not available, write 'Not available.' If data is contradictory or unclear, write 'Conflicting data provided.' Use professional medical terminology and maintain a clinician-facing tone. Include details needed for OASIS and Pre-Claim Review (PCR) documentation."
  //       },
  //       "Reimbursement and Documentation": {
  //         "Description": "After listing all potential ICD-10 codes, clearly identify which code is primary and which are secondary to optimize reimbursement potential. Highlight any skilled interventions (e.g., wound care, complex medication management) supported by the listed diagnoses and linked medications. Provide OASIS-critical details (ADLs, mobility, cognitive function, wound care specifics) and ensure that documentation supports the necessity of skilled home health services. At the end of the summary, list potential Home Health Billing Codes that align with the patient’s conditions and services required."
  //       },
  //       "Final Check": {
  //         "Description": "Confirm all sections are complete.Verify that ICD-10 codes are assigned for each identified condition and link to each medication if possible. Ensure that your primary and secondary diagnosis allign with maximum appropriate reimbusment.Include potential health billing codes for example (eg, G0299 for RN,G0159 for PT) at the end"
  //       }
  //     }
  //   },
  //   "Required Format": {
  //     "Patient Information": {
  //       "Name": "[Patient’s full name]",
  //       "Date of Birth": "[MM/DD/YYYY]",
  //       "Gender": "[Patient’s gender]",
  //       "Medicare/Insurance ID": "[ID number]",
  //       "Primary Care Physician": "[Name]",
  //       "Emergency Contact": "[Name, Phone]"
  //     },
  //     "Visit Information (or Hospital Discharge Information)": {
  //       "Hospital Name (if applicable)": "[Name of the hospital or “Not applicable”]",
  //       "Date of Admission / Visit": "[MM/DD/YYYY]",
  //       "Date of Discharge / End of Visit": "[MM/DD/YYYY or “Ongoing”]",
  //       "Reason for Admission / Visit": "[Reason provided]",
  //       "Discharge Diagnosis or Visit Diagnosis": "[Final or interim diagnoses, if applicable]",
  //       "Note": "If this is a routine home health visit rather than a hospital discharge, adapt these fields accordingly (e.g., “Date of Visit,” “Visit Reason,” etc.)."
  //     },
  //     "ICD-10 Coding for Reimbursement": {
  //       "List of All Identified Diagnoses (with ICD-10 Codes)": "Ensure these codes are the most specific possible and fully support home health needs. If uncertain, note “ICD-10 code not provided.”",
  //       "Primary Diagnosis (ICD-10 Code)": "This is the diagnosis most relevant to home health services and skilled interventions. Optimize for home health billing under PDGM (e.g., a wound care diagnosis if wound care is the primary skilled service).",
  //       "Secondary Diagnoses (ICD-10 Codes)": "Include additional codes that justify comorbidities or complexities. These may increase the clinical grouping and support higher reimbursement if they are valid for home health."
  //     },
  //     "Discharge Summary": {
  //       "Overview": "Provide a brief overview of the hospital stay, treatments, and the patient’s condition at discharge."
  //     },
  //     "Medical History": {
  //       "Chronic Conditions": "[List ongoing conditions and ICD-10 codes if determined]",
  //       "Surgical History": "[List surgeries with dates if available]",
  //       "Allergies": "[List allergies or 'No known allergies']"
  //     },
  //     "Lab and Diagnostic Test Results": {
  //       "Significant Lab Results": "[Abnormal values, trends]",
  //       "Imaging/Diagnostics": "[Key findings from imaging studies]"
  //     },
  //     "Progress Notes from Clinicians": {
  //       "Care Complexity and Skilled Interventions": "[Summarize nurse/therapist/physician notes demonstrating the need for skilled services]",
  //       "Plan of Care Adjustments": "[Any recommended changes based on today’s findings]"
  //     },
  //     "Medications Linked to ICD-10 Codes": {
  //       "Format": "Medication Name | Dosage | Frequency | Route | Associated ICD-10 Code(s) For each medication,assign ICD-10 codes that justify its use(e.g, Metformin → E11.9 for Type 2 Diabetes Mellitus). If unsure, note “ICD-10 code not provided."
  //     },
  //     "Changes in medications during hospital stay": {
  //       "(State any aditions": "discontinuations,or dosage adjustments)"
  //     },
  //     "Treatment and Procedures": {
  //       "Key Procedures": "[List significant procedures and outcomes]",
  //       "Wound Care": "[Describe wounds, their ICD-10 codes if relevant (e.g., pressure ulcer codes), and care provided]"
  //     },
  //     "Progress Notes from the Clinicians": "[Summarize notes supporting skilled care need and complexity]",
  //     "Functional Status at Discharge": {
  //       "Mobility": "[e.g., independent, requires assistance]",
  //       "ADLs": "[Detail assistance needed for bathing, dressing, feeding, etc.]",
  //       "Cognitive Function": "[Orientation, memory, ability to follow instructions]"
  //     },
  //     "Vital Signs at Discharge": {
  //       "Temperature": "[Value and unit]",
  //       "Pulse": "[Value/min]",
  //       "Respiration Rate": "[Value/min]",
  //       "Blood Pressure": "[Systolic/Diastolic mmHg]",
  //       "Oxygen Saturation": "[Value and if on room air or O2]"
  //     },
  //     "Discharge Instructions and Follow-Up Care Instructions": {
  //       "Key Instructions": "[Patient/family instructions]",
  //       "Dietary Restrictions": "[If any]",
  //       "Activity Restrictions": "[If any]",
  //       "Follow-Up Appointments": "[Dates, providers, locations]"
  //     },
  //     "Short-Term and Long-Term Goals (for OASIS)": "[Set measurable goals for ADLs, wound healing, medication adherence, etc.]",
  //     "OASIS Considerations": "Provide detail on functional and clinical findings that directly inform OASIS scoring.",
  //     "PCR (Pre-Claim Review) Documentation": {
  //       "Skilled Interventions": "Document all skilled interventions and care coordination to justify the need for skilled home health services and support reimbursement."
  //     },
  //     "Compliance and Reimbursement Considerations": {
  //       "Description": "Ensure all documentation shows medical necessity, adherence to the plan of care, and supports compliance with Medicare and insurance requirements."
  //     },
  //     "Potential Home Health Billing Codes": {
  //       "Relevant G-Codes": "e.g., G0299 (RN), G0159 (PT), G0158 (OT), G0156 (HHA). If none apply, note “Not available.”"
  //     },
  //     "Final Check Before Submission": {
  //       "Medication Linkage": "Confirm that each medication is linked to an ICD-10 code if possible.",
  //       "Code Optimization": "Verify that the primary and secondary ICD-10 codes are chosen to optimize reimbursement.",
  //       "Completeness": "Ensure all required details are present and clearly documented. Present the summary as instructed."
  //     },
  //     "Patient Health Index (PHI) Update": {
  //       "After each visit or discharge, recalculate or confirm the PHI based on any new data:": "",
  //       "PHI Score (0–100)": "[Updated numeric value]",
  //       "Risk Level": "[Low, Moderate, High] based on thresholds (e.g., ≤33, 34–66, ≥67)",
  //       "Trend": "[Compare current PHI to previous score—“Increased,” “Decreased,” or “No change”]",
  //       "Category Breakdown": "[Show each category’s raw and weighted scores, highlighting new or changed inputs]",
  //       "Recommended Action": "[Optional suggestions, e.g., “Refer to cardiology,” “Increase nursing visits,” “Evaluate for home PT”]",
  //       "Note": "If data is incomplete or missing, clearly state the potential impact on PHI accuracy."
  //     },
  //     "Final Check before Submission": {
  //       "Verify ICD-10 Codes": "Confirm that each diagnosis is assigned and aligned with PDGM needs.",
  //       "Confirm Data Completeness": "If anything is missing, document “Not available.”",
  //       "Validate PHI": "Ensure updated PHI reflects any new acute events, SDoH changes, or functional status updates.",
  //       "Ensure All Requirements Are Met": "OASIS items, PCR documentation, skilled care justification, and billing codes."
  //     },
  //     "Requirements Checklist": {
  //       "ICD-10 Optimization": "Explicit mention of aligning diagnoses with home health billing (PDGM or equivalent).",
  //       "Detailed Medical and Functional Status": "Covers chronic/acute conditions, meds, functional status, vitals, labs.",
  //       "Discharge/Visit Summary Structure": "Mirrors headings for compliance and clarity.",
  //       "OASIS, PCR, Reimbursement": "Affirmed throughout (sections for OASIS scoring, PCR, G-codes).",
  //       "PHI Update": "Includes score, risk level, trend, and a component breakdown.",
  //       "Missing Data Handling": "Instructed to note “Not available” or “Conflicting data provided.”",
  //       "Final Check": "Encourages double-checking codes, data completeness, and PHI correctness."
  //     },
  //     "Summary": "No steps appear omitted. This rewritten prompt integrates all earlier instructions while emphasizing optimized ICD-10 coding for home health billing and ensuring an ongoing PHI update process."
  //   }
  // }. the response should be in the json format using the above format. I dont want to see three slashes and json text at either start or finish I just want clean json response.
  //    `;
  useEffect(() => {
    const fetchData = async () => {
      if (id) {
        try {
          const docRef = doc(db, "uploads", id);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const fileNames = data.fileUrls.map((file) => file.fileName);

            console.log(fileNames);
            setSelectedFiles(fileNames.map((name) => ({ name })));
            setInputText(data.prompt || "");
            setSelectedButton(data.summaryType);
            setRewrittenText(data.rewrittenText);
          } else {
            console.log("No such document!");
          }
        } catch (error) {
          console.error("Error fetching document:", error);
        }
      } else {
        setSelectedFiles([]);
        setInputText("");
        setSelectedButton("Patient History");
        setRewrittenText(null);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsSignInModalOpen(false); // Close modal if clicked outside
      }
    };

    if (isSignInModalOpen) {
      document.addEventListener("mousedown", handleClickOutside); // Add event listener
    } else {
      document.removeEventListener("mousedown", handleClickOutside); // Cleanup on modal close
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside); // Cleanup on unmount
    };
  }, [isSignInModalOpen]);

  const handleFileUpload = (event) => {
    const newFiles = Array.from(event.target.files);
    // If there are existing files, append the new ones, otherwise reset to new files
    if (rewrittenText) {
      setSelectedFiles(newFiles);
      setRewrittenText(null);
    } else {
      setSelectedFiles((prevFiles) => {
        if (prevFiles.length === 0) {
          return newFiles; // Start fresh if there are no files already selected
        }
        return [...prevFiles, ...newFiles];
      });
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleInputChange = (event) => {
    setInputText(event.target.value);
  };

  const handleButtonClick = (buttonId) => {
    setSelectedButton(buttonId);
  };

  const generateMRN = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendClick = async () => {
    if (!user) {
      setIsSignInModalOpen(true);
      return;
    }

    setLoadingDiv(true);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("pdfs", file);
    });

    let prompt = "";
    if (selectedButton === "Patient History") {
      prompt = inputText || queryPrompt;
    } else if (selectedButton === "Differential Diagnosis") {
      prompt =
        inputText ||
        "Write a detailed summary of non clinical plan of care from the information provided here in the text. Include all the necessary steps to ensure patient care in terms of diet, exercise, therapy, counseling etc";
    }

    formData.append("prompt", prompt);

    try {
      setUploading(true);

      const mergeResponse = await fetch(
        "https://dev.patientime.ai/repair_and_merge_pdfs",
        {
          method: "POST",
          body: formData,
        }
      );

      if (mergeResponse.ok) {
        const mergedPdfBlob = await mergeResponse.blob();

        const rewriteFormData = new FormData();
        rewriteFormData.append("pdf_file", mergedPdfBlob, "merged_summary.pdf");
        rewriteFormData.append("prompt", prompt);

        const rewriteResponse = await fetch(
          "https://dev.patientime.ai/rewrite_pdf",
          {
            method: "POST",
            body: rewriteFormData,
          }
        );

        if (rewriteResponse.ok) {
          const jsonResponse = await rewriteResponse.json();
          console.log(jsonResponse);

          // Get the rewritten_pdf field (which is a stringified JSON)
          const rewrittenPdfString = jsonResponse.rewritten_pdf;

          // Clean the string by removing the json code block markers, including any extra spaces or newlines
          let cleanedString = rewrittenPdfString
            .replace(/^```json\s*\n/, "")
            .replace(/\n```$/, "");

          // Optional: Log the cleaned string before continuing to see if the cleaning works correctly
          console.log(cleanedString);

          // Parse the cleaned string
          const parsedJson = JSON.parse(cleanedString);

          console.log(parsedJson);
          const rewrittenTextFromApi = parsedJson;
          setRewrittenText(rewrittenTextFromApi);

          const uploadId = uuidv4();
          const fileUrls = [];
          for (const file of selectedFiles) {
            const storageRef = ref(
              storage,
              `uploads/${uploadId}/${file.name}/${selectedButton}`
            );
            const uploadResult = await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(uploadResult.ref);
            fileUrls.push({
              url: downloadUrl,
              fileName: file.name,
            });
          }
          const mrn = generateMRN();
          const docRef = doc(db, `uploads/${uploadId}`);
          await setDoc(docRef, {
            email: user.email,
            summaryType: selectedButton,
            uploadedAt: new Date(),
            rewrittenText: rewrittenTextFromApi,
            fileUrls,
            mrn,
          });

          console.log("Data successfully saved to Firestore");
        } else {
          console.error("Error from rewrite_pdf API");
        }
      } else {
        console.error("Error from merge_pdfs API");
      }
    } catch (error) {
      console.error("Error occurred while sending request:", error);
    } finally {
      setUploading(false);
      setLoadingDiv(false);
    }
  };
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      setIsSignInModalOpen(false);
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };
  const renderContent = (data) => {
    if (typeof data === "object" && data !== null) {
      return (
        <div style={{ paddingLeft: "16px" }}>
          {Object.entries(data).map(([key, value], index) => (
            <div
              key={index}
              style={{
                marginBottom: "8px",
              }}
            >
              {/^\d+$/.test(key) ? (
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: "bold",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  • {String(value)} {/* Display bullet point with value */}
                </span>
              ) : (
                <>
                  <span style={{ fontSize: "14px", fontWeight: "bold" }}>
                    {key}:
                  </span>{" "}
                  {renderContent(value)} {/* Recursive call */}
                </>
              )}
            </div>
          ))}
        </div>
      );
    }
    return (
      <span style={{ fontSize: "12px", fontWeight: "normal" }}>
        {String(data)}
      </span>
    );
  };

  const handleDownloadPdf = (data) => {
    if (!data) return;
    console.log("PDF download triggered:", data);

    // Create jsPDF instance with A4 dimensions (portrait, mm, A4)
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 16; // Increased margin for better display
    const availableWidth = pageWidth - 2 * margin;
    const availableHeight = pageHeight - 2 * margin;
    const maxLinesPerPage = 25; // Adjusted for improved spacing
    const lineHeight = availableHeight / maxLinesPerPage;
    let y = margin + lineHeight;
    let currentPage = 1;

    // Function to add header
    const addHeader = () => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      const headerText = "Physician Preferred";
      const textWidth = doc.getTextWidth(headerText);
      doc.setTextColor(150); // Light gray
      doc.text(headerText, pageWidth - margin - textWidth, margin + 2);
      doc.setTextColor(0); // Reset to black
    };

    // Function to add footer
    const addFooter = (pageNum) => {
      const footerText = `Page ${pageNum}`;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(footerText, pageWidth / 2, pageHeight - margin / 2, {
        align: "left",
      });
    };

    // Recursive function to render JSON data with proper indentation
    const renderContent = (data, indentation = 0) => {
      // Check if adding another line exceeds available height, then add a footer and new page
      if (y + lineHeight > pageHeight - margin) {
        addFooter(currentPage);
        doc.addPage();
        currentPage++;
        y = margin + lineHeight;
        addHeader();
      }

      if (typeof data === "object" && data !== null) {
        Object.entries(data).forEach(([key, value]) => {
          // Render the key in bold
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          // Wrap text if needed
          const wrappedKey = doc.splitTextToSize(
            `${" ".repeat(indentation)}${key}:`,
            availableWidth
          );
          wrappedKey.forEach((line) => {
            if (y + lineHeight > pageHeight - margin) {
              addFooter(currentPage);
              doc.addPage();
              currentPage++;
              y = margin + lineHeight;
              addHeader();
            }
            doc.text(line, margin, y);
            y += lineHeight;
          });
          // Render the value recursively with increased indentation
          renderContent(value, indentation + 4);
        });
      } else {
        // Render primitive values
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const wrappedText = doc.splitTextToSize(
          `${" ".repeat(indentation)}${String(data)}`,
          availableWidth
        );
        wrappedText.forEach((line) => {
          if (y + lineHeight > pageHeight - margin) {
            addFooter(currentPage);
            doc.addPage();
            currentPage++;
            y = margin + lineHeight;
            addHeader();
          }
          doc.text(line, margin, y);
          y += lineHeight;
        });
      }
    };

    addHeader();
    renderContent(data);
    addFooter(currentPage);
    doc.save("Physician_Preferred.pdf");
  };

  // const handleDownloadPdf = async (data) => {
  //   if (!data) return;
  //   console.log("Download PDF triggered", data);

  //   // Convert JSON data to a Blob
  //   const jsonString = JSON.stringify(data);
  //   const jsonBlob = new Blob([jsonString], { type: "application/json" });

  //   // Append Blob to FormData (key must match API expectation)
  //   const formData = new FormData();
  //   formData.append("file", jsonBlob, "combined.json");

  //   try {
  //     const response = await fetch("http://13.60.187.155:9994/generate-pdf/", {
  //       method: "POST",
  //       headers: {
  //         // Do not set the Content-Type header when using FormData.
  //         Accept: "application/json",
  //       },
  //       body: formData,
  //     });

  //     if (!response.ok) {
  //       console.error("Network response was not ok", response);
  //       throw new Error(`Error: ${response.status}`);
  //     }

  //     // Retrieve the PDF blob from the response
  //     const pdfBlob = await response.blob();
  //     console.log("Received PDF blob", pdfBlob);

  //     // Create a temporary URL for the PDF blob and trigger download
  //     const downloadUrl = URL.createObjectURL(pdfBlob);
  //     const a = document.createElement("a");
  //     a.href = downloadUrl;
  //     a.download = "generated.pdf";
  //     document.body.appendChild(a);
  //     a.click();
  //     document.body.removeChild(a);
  //     URL.revokeObjectURL(downloadUrl);
  //   } catch (error) {
  //     console.error("Error downloading PDF:", error);
  //   }
  // };

  return (
    <div className="flex flex-col h-full bg-gray-50 shadow-lg rounded-md sm:pt-[18vh]">
      {loadingDiv && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-md text-center">
            <Spin size="large" />
            <p className="mt-4">Processing file(s)...</p>
          </div>
        </div>
      )}

      {isSignInModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className="bg-white p-6 rounded-md shadow-md w-[90vw] md:w-[25vw]"
            ref={modalRef}
          >
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4 text-black">
                Sign in to your account
              </h2>
              <p className="text-gray-500 mb-8">Generate Reports and more!</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-grow overflow-y-auto p-3 pt-[15vh] sm:p-6 pb-[30vh]">
        <p className="font-semibold text-center text-xl mb-4">
          Input a Patient Summary
        </p>
        <p className="text-center mb-4">
          Include age, sex, relevant past medical history, medications,
          presenting symptoms, associated symptoms, etc.
        </p>

        {selectedFiles.map((file, index) => (
          <div
            key={index}
            className="flex items-center justify-between border border-gray-300 bg-gray-100 p-3 rounded-md mb-4"
          >
            <span className="text-gray-800 font-semibold">{file.name}</span>
            <FaTimes
              className="text-gray-500 cursor-pointer"
              onClick={() => handleRemoveFile(index)}
            />
          </div>
        ))}

        {rewrittenText && (
          <div className="mt-4 relative">
            <p className="font-semibold mb-2">Rewritten Summary:</p>
            <div
              className="border border-gray-300 p-4 bg-white rounded-md mb-4"
              style={{
                height: "600px",
                overflowY: "auto",
                marginBottom: "150px",
              }} // Adjust height for mobile responsiveness
              ref={rewrittenTextRef}
            >
              {rewrittenText && renderContent(rewrittenText)}
            </div>
            <button
              onClick={() => handleDownloadPdf(rewrittenText)} // Wrap inside an anonymous function
              className="absolute top-0 right-0 bg-[#015BA3] text-white px-4 py-2 rounded-md"
            >
              <AiOutlineDownload className="mr-2" />
              {/* Download PDF */}
            </button>
          </div>
        )}
      </div>

      <div
        className={`bg-white shadow p-4 border-t fixed right-0 bottom-0 ${
          isSidebarOpen ? "left-[16vw]" : "left-0"
        } transition-all `}
      >
        <div className="flex flex-col gap-4 md:gap-6">
          <div className="flex flex-col sm:flex-row items-center md:gap-2">
            <div className="flex items-center border rounded-md border-gray-300 flex-grow md:w-auto h-full w-full">
              <label className="flex items-center cursor-pointer p-2">
                <BsFileEarmarkArrowUp className="text-gray-400 text-xl" />
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf"
                  multiple
                />
              </label>
              <input
                type="text"
                value={inputText}
                onChange={handleInputChange}
                placeholder="Type a message or upload files"
                className="flex-grow p-2 outline-none h-full text-sm md:text-base"
              />
            </div>
            <button
              onClick={handleSendClick}
              className="bg-[#015BA3] text-white font-semibold px-4 py-2 rounded-md h-full w-full lg:w-[5vw]  md:w-[9vw] sm:mt-0 mt-2"
              disabled={selectedFiles.length === 0 || uploading}
            >
              {uploading ? "Uploading..." : "Send"}
            </button>
          </div>

          {/* <div className="grid grid-cols-2 gap-2 font-semibold text-sm sm:text-[1rem]  ">
            {['Patient History', 'Differential Diagnosis'].map((text, index) => {
              const isDifferentialDiagnosis = text === 'Differential Diagnosis';

              return (
                <Tooltip
                  key={index}
                  title={isDifferentialDiagnosis ? 'Coming Soon' : ''} // Tooltip only for "Differential Diagnosis"
                  placement="top"
                >
                  <button
                    key={index}
                    onClick={() => !isDifferentialDiagnosis && handleButtonClick(text)} // Disable onClick for Differential Diagnosis
                    disabled={isDifferentialDiagnosis} // Disable the button
                    className={`sm:p-2  p-1 border rounded-md    ${selectedButton === text
                      ? 'bg-[#015BA3] text-white border-[#015BA3]'  // Active state
                      : isDifferentialDiagnosis
                        ? 'bg-gray-400 text-gray-200 border-gray-400 cursor-not-allowed'  // Disabled state for Differential Diagnosis
                        : 'bg-white text-[#015BA3] border-[#015BA3]'
                      }`}
                    style={{ cursor: isDifferentialDiagnosis ? 'not-allowed' : 'pointer' }} // Change cursor to not-allowed for disabled button
                  >
                    {text}
                  </button>
                </Tooltip>
              );
            })}
          </div> */}
          <p className="text-gray-500 text-sm mt-2 text-center ">
            <button onClick={toggleModal} className="text-blue-500 underline">
              Disclaimer
            </button>
          </p>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-4 md:p-6 rounded-md shadow-md w-[90vw] md:w-[40vw] max-w-[90vw] h-auto max-h-[80vh]">
            <div className="flex justify-between items-center mb-2 md:mb-4">
              <h2 className="text-lg font-semibold">Disclaimer</h2>
              <FaTimes
                className="cursor-pointer text-gray-500"
                onClick={toggleModal}
              />
            </div>
            {/* Add a fixed height and make the content scrollable */}
            <div className="text-sm text-gray-700 h-[45vh] md:h-64 overflow-y-auto">
              <p>
                Protego Health AI Clinical Decision Support Platform Terms of
                Use Purpose and Functionality The Protego Health AI Clinical
                Decision Support (CDS) platform is specifically designed to
                augment the clinical decision-making processes of healthcare
                professionals. The platform's functionalities include the
                generation of preliminary drafts for differential diagnoses,
                clinical assessments, treatment plans, and responses to clinical
                reference inquiries. Recommendation and Review All outputs
                generated by the AI CDS serve as preliminary recommendations
                intended for independent review by the clinician user. These
                outputs are to be utilized as draft recommendations, requiring
                detailed review and validation by the clinician. The AI CDS
                platform's core features are intended solely as a supplementary
                tool to support clinical reasoning and must not replace or
                override the professional judgment of clinicians. Platform
                Development and Limitations Protego Health is committed to the
                continuous development of the AI CDS platform while recognizing
                and addressing its current limitations. The mission is to
                empower clinicians with a leading-edge AI CDS platform and
                improve patient outcomes globally. Bias and Equity
                Considerations Large language models, such as those utilized in
                the AI CDS platform, inherently possess limitations, including
                the potential to perpetuate biases derived from pre-training,
                fine-tuning, and user input. Protego Health has made extensive
                efforts to mitigate the perpetuation of harmful biases. As part
                of our commitment to safety, equity, and alignment in the
                deployment of AI CDS globally, users are advised to omit
                elements of clinical scenarios related to race, ethnicity,
                sexual orientation, gender, socio-economic status, disabilities,
                age, geographical location, and language or cultural background
                when utilizing the AI CDS. The prevention of bias perpetuation
                and the promotion of health equity are fundamental components of
                Protego Health's mission. Restrictions on Use The Protego Health
                AI CDS platform is explicitly not intended for use by patients.
                Users are strictly prohibited from employing this platform for
                personal health advice or as a substitute for professional
                medical consultation. The platform provides recommendations
                intended to assist clinicians in their clinical decision-making
                processes. AI-generated responses necessitate the expertise of a
                qualified clinician for accurate interpretation, as they often
                encompass a broad spectrum of potential diagnoses, diagnostic
                options, and therapeutic considerations within the context of
                probabilistic clinical reasoning.
              </p>
            </div>
            <div className="flex justify-end  mt-2  ">
              <button
                onClick={toggleModal}
                className="bg-[#015BA3] text-white px-4 py-2 rounded-md "
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
