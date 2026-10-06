import os
from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def setup_document():
    doc = Document()
    
    # Define Margins (Left 1.5, Right 1, Top 1, Bottom 1)
    for section in doc.sections:
        section.page_height = Inches(11.69)
        section.page_width = Inches(8.27)
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1.5)
        section.right_margin = Inches(1)

    # Define NORMAL style (Body Text)
    style_normal = doc.styles['Normal']
    font_normal = style_normal.font
    font_normal.name = 'Times New Roman'
    font_normal.size = Pt(12)
    font_normal.color.rgb = RGBColor(0, 0, 0)
    pf_normal = style_normal.paragraph_format
    pf_normal.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    pf_normal.line_spacing = 1.5
    pf_normal.space_after = Pt(12)
    pf_normal.first_line_indent = Inches(0.5) # Tab indentation

    # Define HEADING 1 style (Chapter Titles)
    style_h1 = doc.styles['Heading 1']
    font_h1 = style_h1.font
    font_h1.name = 'Times New Roman'
    font_h1.size = Pt(16)
    font_h1.bold = True
    font_h1.color.rgb = RGBColor(0, 0, 0)
    pf_h1 = style_h1.paragraph_format
    pf_h1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pf_h1.line_spacing = 1.5
    pf_h1.space_after = Pt(12)
    pf_h1.first_line_indent = Inches(0) # Centered titles don't get first line indent

    # Define HEADING 2 style (Main Sections)
    style_h2 = doc.styles['Heading 2']
    font_h2 = style_h2.font
    font_h2.name = 'Times New Roman'
    font_h2.size = Pt(14)
    font_h2.bold = True
    font_h2.color.rgb = RGBColor(0, 0, 0)
    pf_h2 = style_h2.paragraph_format
    pf_h2.alignment = WD_ALIGN_PARAGRAPH.LEFT
    pf_h2.line_spacing = 1.5
    pf_h2.space_after = Pt(12)
    pf_h2.first_line_indent = Inches(0) # Section headings don't get first line indent

    # Define HEADING 3 style (Subsections)
    style_h3 = doc.styles['Heading 3']
    font_h3 = style_h3.font
    font_h3.name = 'Times New Roman'
    font_h3.size = Pt(12)
    font_h3.bold = True
    font_h3.color.rgb = RGBColor(0, 0, 0)
    pf_h3 = style_h3.paragraph_format
    pf_h3.alignment = WD_ALIGN_PARAGRAPH.LEFT
    pf_h3.line_spacing = 1.5
    pf_h3.space_after = Pt(12)
    pf_h3.first_line_indent = Inches(0)

    # Disable space after for front page items to make it compact
    style_front = doc.styles.add_style('FrontPage', 1)
    font_front = style_front.font
    font_front.name = 'Times New Roman'
    font_front.size = Pt(12)
    pf_front = style_front.paragraph_format
    pf_front.alignment = WD_ALIGN_PARAGRAPH.CENTER
    pf_front.line_spacing = 1.5
    pf_front.space_after = Pt(0)
    pf_front.first_line_indent = Inches(0)
    
    return doc

def add_front_page_text(doc, text, bold=False, size=12):
    p = doc.add_paragraph(style='FrontPage')
    run = p.add_run(text)
    run.font.bold = bold
    run.font.size = Pt(size)

def get_report_content(doc):
    # Front Pages
    add_front_page_text(doc, "A")
    add_front_page_text(doc, "Industrial Oriented Mini Project Report")
    add_front_page_text(doc, "on")
    add_front_page_text(doc, "TALENTLINK: A PROFESSIONAL FREELANCER PLATFORM", bold=True, size=16)
    
    doc.add_paragraph("", style='Normal')
    add_front_page_text(doc, "Submitted to\nJawaharlal Nehru Technological University, Hyderabad\nFor the partial fulfilment of requirements for the award of the degree in")
    
    doc.add_paragraph("", style='Normal')
    add_front_page_text(doc, "BACHELOR OF TECHNOLOGY", bold=True, size=14)
    add_front_page_text(doc, "in")
    add_front_page_text(doc, "COMPUTER SCIENCE AND ENGINEERING", bold=True, size=14)
    
    doc.add_paragraph("", style='Normal')
    add_front_page_text(doc, "Submitted by")
    add_front_page_text(doc, "ADI ROSHINI (23271A05D9)\nVATARIKARI MANISHA (23271A05C8)\nARMOOR AKHILA (23271A05B9)\nARANDKAR VAESHNAVI (23271A05G3)", bold=True, size=12)
    
    doc.add_paragraph("", style='Normal')
    add_front_page_text(doc, "Under the Esteemed guidance of")
    add_front_page_text(doc, "K. SAI VEENA\nAssociate Professor Dept. of CSE", bold=True)
    
    doc.add_paragraph("", style='Normal')
    add_front_page_text(doc, "DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING\nJYOTHISHMATHI INSTITUTE OF TECHNOLOGY AND SCIENCE", bold=True, size=14)
    add_front_page_text(doc, "(Autonomous, NBA (CSE, ECE, EEE) and NAAC ‘A’ Grade)\n(Approved by AICTE, New Delhi, Affiliated to JNTUH, Hyderabad)\nNustulapur, Karimnagar 505481, Telangana, India\n2025-2026")
    doc.add_page_break()

    # Certificate
    doc.add_paragraph("CERTIFICATE", style='Heading 1')
    doc.add_paragraph("This is to certify that the Industrial Oriented Mini Project Report entitled “TALENTLINK: A PROFESSIONAL FREELANCER PLATFORM” is being submitted by ADI ROSHINI (23271A05D9), VATARIKARI MANISHA (23271A05C8), ARMOOR AKHILA (23271A05B9), ARANDKAR VAESHNAVI (23271A05G3) in partial fulfilment of the requirements for the award of the Degree of Bachelor of Technology in Computer Science & Engineering to the Jyothishmathi Institute of Technology & Science, Karimnagar, during academic year 2025-2026, is a bonafide work carried out by them under my guidance and supervision.", style='Normal')
    doc.add_paragraph("The results presented in this Project Work have been verified and are found to be satisfactory. The results embodied in this Project Work have not been submitted to any other University for the award of any other degree or diploma.", style='Normal')
    
    p = doc.add_paragraph("", style='Normal')
    p.paragraph_format.first_line_indent = Inches(0)
    p.add_run("\n\nProject Guide\t\t\t\t\tHead of the Department\nK. SAI VEENA\t\t\t\t\tDr. M. Ravinder\nAssociate Professor\t\t\t\t\tAssociate Professor\nDept. of CSE\t\t\t\t\t\tDept. of CSE\n\n\n\n\n\t\t\tEXTERNAL EXAMINER").bold = True
    doc.add_page_break()

    # Acknowledgement
    doc.add_paragraph("ACKNOWLEDGEMENT", style='Heading 1')
    doc.add_paragraph("We would like to express our sincere gratitude to our advisor, K. SAI VEENA, whose knowledge and guidance has motivated us to achieve goals we never thought possible. The time we have spent working under her supervision has truly been a pleasure.", style='Normal')
    doc.add_paragraph("The experience from this kind of work is great and will be useful to us in future. We thank Dr. M. RAVINDER, Associate Professor & HOD CSE Dept. for his effort, kind cooperation, guidance and encouraging us to do this work and also for providing the facilities to carry out this work.", style='Normal')
    doc.add_paragraph("It is a great pleasure to convey our thanks to Dr. T. ANIL KUMAR, Principal, Jyothishmathi Institute of Technology & Science and the College Management for permitting us to undertake this project and providing excellent facilities to carry out our project work. We thank all the Faculty members of the Department of Computer Science & Engineering for sharing their valuable knowledge with us. We extend our thanks to the Technical Staff of the department for their valuable suggestions to technical problems.", style='Normal')
    doc.add_paragraph("Finally, special thanks to our parents for their support and encouragement throughout our life and this course. Thanks to all our friends and well-wishers for their constant support.", style='Normal')
    doc.add_page_break()

    # Declaration
    doc.add_paragraph("DECLARATION", style='Heading 1')
    doc.add_paragraph("We hereby declare that the work which is being presented in this dissertation entitled, “TALENTLINK: A PROFESSIONAL FREELANCER PLATFORM”, submitted towards the partial fulfilment of the requirements for the award of the degree of Bachelor of Technology in Computer Science & Engineering, Jyothishmathi Institute of Technology & Science, Karimnagar is an authentic record of our own work carried out under the supervision of K. Sai Veena, Associate Professor, Department of CSE, Jyothishmathi Institute of Technology and Science, Karimnagar.", style='Normal')
    doc.add_paragraph("To the best of our knowledge and belief, this project bears no resemblance with any report submitted to JNTUH or any other University for the award of any degree or diploma.", style='Normal')
    
    p = doc.add_paragraph("", style='Normal')
    p.paragraph_format.first_line_indent = Inches(0)
    p.add_run("\nADI ROSHINI (23271A05D9)\nVATARIKARI MANISHA (23271A05C8)\nARMOOR AKHILA (23271A05B9)\nARANDKAR VAESHNAVI (23271A05G3)")
    p.add_run("\n\nDate:\nPlace: Karimnagar")
    doc.add_page_break()

    # Abstract
    doc.add_paragraph("ABSTRACT", style='Heading 1')
    doc.add_paragraph("TalentLink connects freelancers and clients through a clear and organized system. As remote work and the digital economy grow, there is a greater need for platforms that make hiring and collaboration easier. Current systems often struggle with disorganized workflows, gaps in communication, and challenges in managing proposals and project progress. TalentLink offers a dependable space where clients can post project needs, and freelancers can find opportunities and submit proposals that match their skills. The platform promotes organized project management, clear communication, and structured teamwork throughout the project.", style='Normal')
    doc.add_paragraph("By streamlining workflows and improving user communication, TalentLink makes managing freelance projects simpler. The main goal of the system is to make the hiring process easier, improve transparency, and create a professional environment for freelance collaboration. TalentLink seeks to boost efficiency, support effective teamwork, and deliver a scalable solution. The rapid growth of digital technology and the rise of remote work have changed how organizations and individuals work together. Freelancing platforms connect skilled professionals with clients needing specific services for project-based work.", style='Normal')
    doc.add_paragraph("However, many existing freelance platforms struggle with issues like unstructured workflows, poor project management, communication gaps, and challenges in finding reliable professionals. These issues create difficulties for freelancers looking for real opportunities and for clients seeking skilled individuals to complete projects effectively. TalentLink offers a structured workflow that supports proposal submission, communication, project tracking, and collaboration throughout the project's lifecycle. It helps freelancers highlight their skills and experience while enabling clients to review proposals and pick the best candidates for their projects. By improving communication and lowering workflow complexity, the system ensures smoother collaboration and better project results.", style='Normal')
    doc.add_page_break()

    # Table of Contents
    doc.add_paragraph("TABLE OF CONTENTS", style='Heading 1')
    toc_p = doc.add_paragraph("", style='Normal')
    toc_p.paragraph_format.first_line_indent = Inches(0)
    toc_p.add_run("CHAPTER NO \t TITLE \t PAGE NO\n\nFront Pages\n\tABSTRACT\n\tLIST OF FIGURES\n\n1 \t INTRODUCTION\n\t 1.1 Project Overview\n\t 1.2 Project Purpose\n\t 1.3 Project Scope\n\t 1.4 Project Features\n\n2 \t LITERATURE SURVEY\n\n3 \t EXISTING & PROPOSED SYSTEM\n\t 3.1 Existing System\n\t 3.2 Existing System Disadvantages\n\t 3.3 Problem Statement\n\t 3.4 Proposed System\n\t 3.5 Proposed System Advantages\n\n4 \t SYSTEM REQUIREMENTS\n\t 4.1 Hardware Requirements\n\t 4.2 Software Requirements\n\n5 \t PROJECT DESCRIPTION\n\n6 \t SYSTEM DESIGN\n\t 6.1 System Architecture\n\t 6.2 Data Flow Design\n\t 6.3 UML Design\n\t\t 6.3.1 Use Case Diagram\n\t\t 6.3.2 Class Diagram\n\t\t 6.3.3 Activity Diagram\n\t\t 6.3.4 Sequence Diagram\n\n7 \t IMPLEMENTATION\n\n8 \t RESULTS\n\n9 \t FUTURE SCOPE\n\n10 \t CONCLUSION\n\n\t REFERENCES")
    doc.add_page_break()

    # List of Figures
    doc.add_paragraph("LIST OF FIGURES", style='Heading 1')
    fig_p = doc.add_paragraph("", style='Normal')
    fig_p.paragraph_format.first_line_indent = Inches(0)
    fig_p.add_run("FIGURE NO \t NAME OF THE FIGURE \n\n5.1 \t TalentLink Sign Up\n5.2 \t TalentLink Dashboard\n5.3 \t User Profile View\n5.4 \t Project Posting Interface\n6.1 \t System Architecture\n6.2.1 \t Data Flow Diagram for TalentLink Platform\n6.2.2 \t User Flow Diagram\n6.3.1 \t Use Case Diagram\n6.3.2 \t Class Diagram\n6.3.3 \t Activity Diagram\n6.3.4 \t Sequence Diagram")
    doc.add_page_break()

    # Chapters Start
    doc.add_paragraph("CHAPTER 1", style='Heading 1')
    doc.add_paragraph("INTRODUCTION", style='Heading 1')
    
    doc.add_paragraph("1.1 Project Overview", style='Heading 2')
    doc.add_paragraph("Freelancing has become a key part of the modern digital economy. It allows individuals to work independently and offer services to clients from various locations. Many organizations and businesses prefer hiring freelancers for short-term projects because of the flexibility and access to specific skills. However, finding trustworthy freelancers and managing freelance projects can be tough for both clients and freelancers. TalentLink is a professional freelance matchmaking platform designed to connect freelancers and clients through a clear and organized system.", style='Normal')
    doc.add_paragraph("The platform lets clients post project needs and allows freelancers to browse available opportunities and submit proposals that match their skills. It also supports project management and communication, and teamwork throughout the project. The main goal of TalentLink is to make the freelance hiring process easier and improve collaboration between freelancers and clients. By offering a centralized platform, the system ensures transparency, an organized workflow, and effective management of freelance projects.", style='Normal')

    doc.add_paragraph("1.2 Project Purpose", style='Heading 2')
    doc.add_paragraph("The purpose of the TalentLink project is to create a professional platform that connects freelancers and clients in a clear and effective environment. With the rise of the digital economy and the remote work culture, freelancing has become a popular way for organizations to complete projects using skilled professionals from various locations. However, many freelancers struggle to find reliable project opportunities, while clients often find it hard to identify the right talent for their needs. TalentLink seeks to solve these problems by offering a centralized system that streamlines freelance hiring and project management. The platform allows for smooth interaction between freelancers and clients while promoting transparency and an organized workflow.", style='Normal')
    doc.add_paragraph("TalentLink is created to simplify the entire freelance hiring lifecycle—from project posting to proposal submission, selection, execution, and completion. The system provides a streamlined approach where clients can clearly define their project requirements, budgets, and timelines, while freelancers can showcase their skills, experience, and previous work. By implementing a well-organized proposal management system, the platform ensures that clients can easily compare submissions and select the most suitable candidate based on expertise and credibility.", style='Normal')
    doc.add_paragraph("TalentLink focuses on building a trustworthy and transparent freelance environment. By maintaining professional profiles, organized records of transactions, and secure interactions, the platform encourages accountability and long-term collaboration. The system is designed not only to connect people but also to create a sustainable freelance ecosystem where quality work, timely delivery, and client satisfaction are prioritized.", style='Normal')

    doc.add_paragraph("1.3 Project Scope", style='Heading 2')
    doc.add_paragraph("The TalentLink project aims to create a professional freelance matchmaking platform that connects freelancers and clients in an efficient way. The platform simplifies finding freelance opportunities and managing project collaborations. It offers a central system where clients can post projects, and freelancers can browse available work and submit proposals. TalentLink seeks to improve the freelance workflow by providing clear communication, project tracking, and collaboration tools. This helps both freelancers and clients manage their tasks effectively within one platform.", style='Normal')
    doc.add_paragraph("The scope of the TalentLink project focuses on developing a professional freelance matchmaking platform that connects freelancers and clients in an organized and efficient environment. The platform is designed to simplify the process of finding freelance opportunities and managing project collaborations. It provides a centralized system where clients can post projects and freelancers can browse available opportunities and submit proposals. Future scope includes scalability adding advanced collaboration and secure tools.", style='Normal')

    doc.add_paragraph("1.4 Project Features", style='Heading 2')
    doc.add_paragraph("Users: TalentLink allows freelancers and clients to sign up for an account; once registered, users can log in with secure credentials. This way, only registered users can log in to the system.", style='Normal')
    doc.add_paragraph("Project posting: Clients may post the project details (length of project, skill set, etc.) to allow freelancers to review them and identify potential projects.", style='Normal')
    doc.add_paragraph("Proposal Submission: Freelancers can review posted projects and submit proposals according to their skills, experience, and type of work needed.", style='Normal')
    doc.add_paragraph("Communication: The platform provides a means to allow freelancers and clients to communicate regarding working on the project together.", style='Normal')
    doc.add_paragraph("Project Management: The platform provides users with a streamlined method for managing a project via tracking of the project from proposal submission to completion.", style='Normal')
    doc.add_paragraph("Review and Feedback: After a project is completed, clients can provide feedback to the freelancer and rate the freelancer's work, thereby creating an environment of openness and trust on the platform.", style='Normal')
    doc.add_paragraph("User Profiles: Freelancers can create a profile that lists their experience, skill set and previous projects which helps clients find the appropriate freelancer for the job.", style='Normal')
    doc.add_page_break()

    # CHAPTER 2
    doc.add_paragraph("CHAPTER 2", style='Heading 1')
    doc.add_paragraph("LITERATURE SURVEY", style='Heading 1')
    doc.add_paragraph("The rapid rise in digital technology and remote work has led to an increase in demand for online freelancing platforms. These platforms link clients that have a requirement for a precise task or service with independent contractors who possess the skills needed to meet those requirements. The way that freelancing systems work gives independent contractors the ability to work as independent professionals. In addition, organizations benefit from being able to access all of the global talent available through freelance systems. However, having effective management of freelance workers and successful collaborations between organizations and independent contractors requires an effective structure for how projects are established, a way to have transparent communication among all parties, and a reliable project management process for all projects.", style='Normal')
    doc.add_paragraph("Numerous research documents exist regarding the development of online marketplace platforms for service-based services between independent contractors and their clients. These platforms are expected to provide users with features such as registration to use the platforms, posting of projects, submitting proposals for work by independent contractors, and communication between platform users during the execution of their project. Developing and managing the overall structure of the workflow of the individual projects in conjunction with secured communication between independent contractors and their clients is critical to improving collaboration levels and successfully completing the project.", style='Normal')
    doc.add_paragraph("Other documents provide evidence that centralized performance-based systems for managing independent contractor activities (freelancers) give users greater efficiency-related value when managing their independent contractor activities. As a result, these systems are intended to streamline the process of hiring independent contractors; enhance project tracking between independent contractors and their clients; and provide greater transparency in the relationships between independent contractors and clients.", style='Normal')
    doc.add_page_break()

    # CHAPTER 3
    doc.add_paragraph("CHAPTER 3", style='Heading 1')
    doc.add_paragraph("EXISTING & PROPOSED SYSTEM", style='Heading 1')
    
    doc.add_paragraph("3.1 Existing System", style='Heading 2')
    doc.add_paragraph("The existing freelancing systems provide platforms where clients can post projects and freelancers can search for job opportunities. These platforms allow freelancers to apply for projects based on their skills and experience. However, many existing systems still face challenges in managing freelance collaborations efficiently. In several cases, the workflow between freelancers and clients is not well organized, which may lead to confusion and delays in project completion.", style='Normal')
    doc.add_paragraph("In many traditional freelance systems, communication between clients and freelancers may not be properly structured. This can cause misunderstandings regarding project requirements, deadlines, and deliverables. Additionally, tracking the progress of freelance projects can become difficult without a centralized system that manages proposals, contracts, and communication. Therefore, there is a need for a structured platform that simplifies freelance collaboration, improves communication, and provides efficient project management features.", style='Normal')
    
    doc.add_paragraph("3.2 Existing System Disadvantages", style='Heading 2')
    doc.add_paragraph("• Lack of structured workflow for managing freelance projects.", style='Normal')
    doc.add_paragraph("• Difficulty in identifying reliable freelancers for specific project requirements.", style='Normal')
    doc.add_paragraph("• Communication gaps between freelancers and clients.", style='Normal')
    doc.add_paragraph("• Inefficient project tracking and management.", style='Normal')
    doc.add_paragraph("• Time-consuming hiring process.", style='Normal')

    doc.add_paragraph("3.3 Problem Statement", style='Heading 2')
    doc.add_paragraph("In the current freelance ecosystem, clients often face difficulties in finding skilled and reliable freelancers who can meet their project requirements within the specified time. Similarly, freelancers may struggle to discover genuine and suitable project opportunities that match their skills and expertise. Many existing freelance systems do not provide a structured workflow for managing freelance collaborations, which may lead to communication gaps, delays in project completion, and inefficiencies in project management.", style='Normal')
    doc.add_paragraph("Additionally, the lack of a centralized platform for handling project proposals and monitoring project progress, and maintaining clear communication between users makes the freelance hiring process more complicated and time-consuming. Without proper management systems, it becomes difficult for both freelancers and clients to track project activities and ensure transparency throughout the project lifecycle. Therefore, there is a need to develop a professional freelance matchmaking platform that simplifies the hiring process and improves collaboration.", style='Normal')

    doc.add_paragraph("3.4 Proposed System", style='Heading 2')
    doc.add_paragraph("The limitations of existing freelance systems highlight the need for a more efficient platform for managing freelance collaborations. TalentLink is proposed as a professional freelance matchmaking platform that provides a structured environment for connecting freelancers and clients. The system allows clients to post project requirements and enables freelancers to browse available opportunities and submit proposals based on their skills and experience.", style='Normal')
    doc.add_paragraph("The platform ensures organized communication and collaboration between freelancers and clients throughout the project lifecycle. By providing a centralized system for project posting, proposal submission, and project tracking, TalentLink simplifies the freelance hiring process and improves transparency. The system helps clients identify suitable freelancers efficiently while enabling freelancers to access genuine project opportunities.", style='Normal')

    doc.add_paragraph("3.5 Proposed System Advantages", style='Heading 2')
    doc.add_paragraph("Efficient Hiring Process: The platform simplifies the process of finding and hiring freelancers by providing a centralized system for project posting and proposal submission.", style='Normal')
    doc.add_paragraph("Improved Communication: TalentLink enables clear and organized communication between freelancers and clients, reducing misunderstandings during project collaboration.", style='Normal')
    doc.add_paragraph("Better Project Management: The system provides structured workflows for managing projects, making it easier to track progress and monitor activities.", style='Normal')
    doc.add_paragraph("Transparency and Trust: The platform allows clients to review freelancer profiles and feedback, helping build trust and transparency in freelance collaborations.", style='Normal')
    doc.add_paragraph("Centralized Platform: All freelance activities such as project posting, proposal management, and communication are handled within a single platform, improving efficiency.", style='Normal')
    doc.add_page_break()

    # CHAPTER 4
    doc.add_paragraph("CHAPTER 4", style='Heading 1')
    doc.add_paragraph("SYSTEM REQUIREMENTS", style='Heading 1')
    
    doc.add_paragraph("4.1 Hardware Requirements", style='Heading 2')
    doc.add_paragraph("Hardware requirements specify the basic physical components required to develop and run the TalentLink platform. Since the project is a web-based application, it does not require any specialized hardware components. The following hardware components are sufficient for the development and execution of the system:", style='Normal')
    doc.add_paragraph("• Processor: Intel Core i3 or above", style='Normal')
    doc.add_paragraph("• RAM: Minimum 4 GB (8 GB recommended)", style='Normal')
    doc.add_paragraph("• Storage: Minimum 10 GB free disk space", style='Normal')
    doc.add_paragraph("• System Type: 64-bit computer", style='Normal')
    doc.add_paragraph("• Internet Connection: Required for development, testing, and deployment", style='Normal')

    doc.add_paragraph("4.2 Software Requirements", style='Heading 2')
    doc.add_paragraph("Software requirements define the tools and technologies used to develop the TalentLink platform. The proposed system employs a modern robust technological stack:", style='Normal')
    doc.add_paragraph("• Operating System: Windows / Linux / macOS", style='Normal')
    doc.add_paragraph("• Programming Languages: Python, JavaScript", style='Normal')
    doc.add_paragraph("• Frontend Framework: React", style='Normal')
    doc.add_paragraph("• Backend Framework: Django, Django REST Framework", style='Normal')
    doc.add_paragraph("• Database: SQLite, PostgreSQL", style='Normal')
    doc.add_paragraph("• API Tools: Postman, Swagger", style='Normal')
    doc.add_paragraph("• IDE: Visual Studio Code", style='Normal')
    doc.add_paragraph("• Version Control: Git, GitHub", style='Normal')
    doc.add_paragraph("• Web Browser: Google Chrome", style='Normal')
    doc.add_page_break()

    # CHAPTER 5
    doc.add_paragraph("CHAPTER 5", style='Heading 1')
    doc.add_paragraph("PROJECT DESCRIPTION", style='Heading 1')
    doc.add_paragraph("The TalentLink platform is designed to provide a professional environment where freelancers and clients can collaborate efficiently for project-based work. The system focuses on simplifying the process of discovering freelance opportunities, submitting proposals, and managing projects through a structured workflow. The platform consists of two primary user roles: Clients and Freelancers. Clients are users who post project requirements, while freelancers are professionals who search for projects and submit proposals.", style='Normal')
    doc.add_paragraph("When a client registers on the platform, they can create and publish project listings that include details such as project description, required skills, deadlines, and budget. Freelancers can browse available projects and submit proposals that describe how they can complete the project. Clients can review these proposals and select the most suitable freelancer for their project. Once a freelancer is selected, the platform allows both users to communicate and collaborate throughout the project lifecycle.", style='Normal')
    doc.add_paragraph("The system supports project tracking, enabling both freelancers and clients to monitor the progress of the project. This structured workflow helps ensure transparency and reduces misunderstandings between users. TalentLink also provides profile management features that allow freelancers to showcase their skills, experience, and previous work. This helps clients evaluate freelancers effectively before assigning projects.", style='Normal')
    doc.add_paragraph("By organizing freelance collaboration into a centralized system, TalentLink improves efficiency and simplifies the freelance hiring process. The platform provides a reliable environment where freelancers can access genuine opportunities and clients can find skilled professionals for their projects securely and seamlessly.", style='Normal')
    doc.add_page_break()

    # CHAPTER 6
    doc.add_paragraph("CHAPTER 6", style='Heading 1')
    doc.add_paragraph("SYSTEM DESIGN", style='Heading 1')

    doc.add_paragraph("6.1 System Architecture", style='Heading 2')
    doc.add_paragraph("The system architecture of TalentLink follows a structured web application architecture that enables communication between users, the application interface, and the database. The platform is designed to provide a reliable environment where freelancers and clients can interact, manage projects, and collaborate efficiently.", style='Normal')
    doc.add_paragraph("The architecture consists of three main components: the frontend layer, the backend layer, and the database layer. The frontend layer provides the user interface through which clients and freelancers interact with the system. It allows users to register, log in, browse projects, submit proposals, and manage project activities.", style='Normal')
    doc.add_paragraph("The database layer is responsible for storing and managing all system data, including user information, project details, proposals, contracts, and reviews. The database ensures that information is stored securely and can be retrieved whenever required. When a user performs an action on the platform, the request is sent from the frontend to the backend which processes the request, interacts with the database to store or retrieve data, and then sends the response back to the frontend.", style='Normal')

    doc.add_paragraph("6.2 Data Flow Design", style='Heading 2')
    doc.add_paragraph("A Data Flow Diagram (DFD) is a graphical representation of the flow of data within a system or process. It is a modelling technique that shows how data moves through processes and how it is stored, transformed, or exchanged within a system. DFDs are used in system analysis and design to visualize and understand the data processing and flow of information in a structured manner.", style='Normal')

    doc.add_paragraph("6.3 UML Design", style='Heading 2')
    doc.add_paragraph("Unified Modelling Language (UML) is a standardized modelling language in the field of software engineering. It provides a way to visualize a system's design through a set of diagrams. UML diagrams help software developers and system architects communicate and understand the structure and behaviour of a system. In UML, the diagrams can be broadly categorized into two main types: structural diagrams and behavioural diagrams.", style='Normal')

    doc.add_paragraph("6.3.1 Use Case Diagram", style='Heading 3')
    doc.add_paragraph("Use Case Diagrams in UML describe interactions between a system and external entities known as actors. Use cases represent specific functionalities or scenarios that the system provides to its users, such as posting jobs and submitting proposals.", style='Normal')

    doc.add_paragraph("6.3.2 Class Diagram", style='Heading 3')
    doc.add_paragraph("The Class Diagram in UML illustrates the static structure of a system, detailing classes, attributes, methods, and their relationships. Rectangles represent classes, and lines indicate associations, dependencies, and inheritances between Users, Projects, and Proposals.", style='Normal')

    doc.add_paragraph("6.3.3 Activity Diagram", style='Heading 3')
    doc.add_paragraph("Activity Diagrams represent the flow of activities within a process or workflow. They focus on actions, decisions, and control flows, providing a high-level view of the dynamic aspects of a system like registering, logging in, and project submission.", style='Normal')

    doc.add_paragraph("6.3.4 Sequence Diagram", style='Heading 3')
    doc.add_paragraph("A sequence diagram merely depicts interaction between objects in a serial order, indicating the order during which these interactions happen. These event diagrams are widely employed by software developers to document operations and workflows.", style='Normal')
    doc.add_page_break()

    # CHAPTER 7
    doc.add_paragraph("CHAPTER 7", style='Heading 1')
    doc.add_paragraph("IMPLEMENTATION", style='Heading 1')
    doc.add_paragraph("The Implementation of the TalentLink system involves constructing the software application using a scalable React.js frontend interface interacting securely with a Python-based backend structure. Upon setup, clients can initialize fully customizable project requests via form submissions that update dynamically into a relational database.", style='Normal')
    doc.add_paragraph("The backend handles critical API routing, ensuring user authentication tokens are securely encrypted and properly authorized prior to any data retrieval. When a Freelancer creates a profile, the data stream is handled entirely by RESTful endpoints, committing changes to the SQL databanks systematically.", style='Normal')
    doc.add_paragraph("Implementation scripts handle strict validation checks, restricting unauthorized proposal submissions and preventing duplicate applications. The deployment phase integrates the codebase onto the designated server architecture allowing multi-tenant traffic to seamlessly traverse through the system's endpoints.", style='Normal')
    doc.add_page_break()

    # CHAPTER 8
    doc.add_paragraph("CHAPTER 8", style='Heading 1')
    doc.add_paragraph("RESULTS", style='Heading 1')
    doc.add_paragraph("The TalentLink platform successfully operates as an effective centralized matchmaking platform connecting clients with specialized independent contractors. Testing workflows verified that project postings generate correctly within active marketplace views. Registration protocols authenticate users securely without introducing lag or database redundancy errors.", style='Normal')
    doc.add_paragraph("Dashboard components reliably isolate client views from freelancer interfaces, ensuring private negotiations and proposal reviews function securely. Overall system evaluation concluded that TalentLink vastly enhances communication, proposal delivery timelines, and transparent monitoring, fulfilling the primary objectives set out during the initial design phase.", style='Normal')
    doc.add_page_break()

    # CHAPTER 9
    doc.add_paragraph("CHAPTER 9", style='Heading 1')
    doc.add_paragraph("FUTURE SCOPE", style='Heading 1')
    doc.add_paragraph("While the TalentLink platform successfully provides a structured environment for connecting freelancers and clients, there are several opportunities for further improvements and enhancements. As the demand for digital freelance platforms continues to grow, the system can be expanded with additional features to improve efficiency, user experience, and scalability.", style='Normal')
    doc.add_paragraph("The future scope of the TalentLink platform includes the following enhancements: AI-Based Project Matching by implementing intelligent algorithms that automatically match freelancers with suitable projects based on skills. Advanced Communication Tools by integrating real-time video communication and file sharing. Secure Payment Integration adding secure online payment systems to manage milestones.", style='Normal')
    doc.add_paragraph("Additionally, developing a mobile application version of TalentLink and introducing an Enhanced Rating System can further streamline accessibility and trust across the platform seamlessly.", style='Normal')
    doc.add_page_break()

    # CHAPTER 10
    doc.add_paragraph("CHAPTER 10", style='Heading 1')
    doc.add_paragraph("CONCLUSION", style='Heading 1')
    doc.add_paragraph("The TalentLink platform provides a structured and efficient solution for connecting freelancers and clients in a professional environment. With the increasing demand for remote work and freelance services, there is a need for reliable platforms that simplify the process of hiring skilled professionals and managing project collaborations. TalentLink addresses these needs by providing a centralized system where clients can post project requirements and freelancers can discover and apply for suitable opportunities.", style='Normal')
    doc.add_paragraph("The system improves collaboration by enabling organized communication, proposal submission, and project tracking throughout the project lifecycle. By offering a structured workflow, TalentLink helps reduce communication gaps and improves transparency between freelancers and clients. The platform also allows freelancers to showcase their skills and experience, helping clients identify suitable professionals for their projects more efficiently.", style='Normal')
    doc.add_paragraph("Overall, TalentLink contributes to improving the freelance hiring process by providing a reliable and organized platform for project collaboration. The system enhances efficiency, transparency, and communication in freelance project management. In the future, the platform can be further enhanced with advanced features such as intelligent project matching, improved collaboration tools, and scalability to support a larger number of users in the growing digital economy.", style='Normal')
    doc.add_page_break()

    # REFERENCES
    doc.add_paragraph("REFERENCES", style='Heading 1')
    doc.add_paragraph("[1] A. Kittur, J. V. Nickerson, M. Bernstein, E. Gerber, A. Shaw, J. Zimmerman, M. Lease and J. Horton, “The Future of Crowd Work,” Proceedings of the 2013 Conference on Computer Supported Cooperative Work, ACM, pp. 1301–1318, 2013.", style='Normal')
    doc.add_paragraph("[2] J. J. Horton and R. J. Zeckhauser, “Online Labor Markets,” Internet and Network Economics, Springer, pp. 515–522, 2010.", style='Normal')
    doc.add_paragraph("[3] M. Kässi and V. Lehdonvirta, “Online Labour Index: Measuring the Online Gig Economy for Policy and Research,” Technological Forecasting and Social Change, vol. 137, pp. 241–248, 2018.", style='Normal')
    doc.add_paragraph("[4] V. Lehdonvirta, O. Kässi, I. Hjorth, H. Barnard and M. Graham, “The Global Platform Economy: A New Offshoring Institution Enabling Emerging-Economy Microproviders,” Journal of Management, vol. 45, no. 2, pp. 567–599, 2019.", style='Normal')
    doc.add_paragraph("[5] J. Horton, “The Effects of Algorithmic Labor Market Recommendations: Evidence from a Field Experiment,” Journal of Labor Economics, vol. 35, no. 2, pp. 345–385, 2017.", style='Normal')
    doc.add_paragraph("[6] S. Donovan, D. Bradley and M. Shimabukuro, “What Does the Gig Economy Mean for Workers?” U.S. Congressional Research Service, 2016.", style='Normal')

if __name__ == "__main__":
    doc = setup_document()
    get_report_content(doc)
    
    output_path = r"c:\Users\V.S.PATEL\Desktop\talentlink\docs\TalentLink_Final_Documentation_Formatted.docx"
    doc.save(output_path)
    print(f"Generated successfully: {output_path}")

