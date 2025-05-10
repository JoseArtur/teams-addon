import { useEffect, useState } from "react";
import * as microsoftTeams from "@microsoft/teams-js";
import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import { FluentProvider, teamsLightTheme } from "@fluentui/react-components";
import { themeNames } from "@fluentui/react-teams";

import { About } from "./about";
import { Privacy } from "./privacy";
import { TermsOfUse } from "./terms_of_use";
import { DashboardTab } from "./static_tabs/dashboard";
import { BoardsTab } from "./static_tabs/task_boards";
import { WelcomeTab } from "./static_tabs/welcome";
import { MyBooksTab } from "./static_tabs/my_books_tab";
import { DiscoverTab } from "./static_tabs/discover";
import { ChallengesTab } from "./static_tabs/challenges";
import { ProfileTab } from "./static_tabs/profile";
import { StudentDashboard } from "./components/StudentDashboard";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { OnboardingStudent } from "./components/OnboardingStudent";
import { checkIfStudentExists, getStudentInfo, GetStudentInfoResponse } from "./services/api";
import { StudentBooks } from "./components/StudentsBooks";
import { StudentRanking } from "./components/StudentRanking";
import { StudentsTab } from "./static_tabs/list";
import { useLocation } from "react-router-dom";
import { AlunoTab } from "./components/AlunoTab";
import { TeacherQuizzesChallengesTab } from "./components/TeacherQuizzesChallengesTab";
import { TeacherEscolhidosDashboard } from "./components/TeacherEscolhidosDashboard";
import { TeacherChallengesTab } from "./components/TeacherChalengesTab";
function MeusAlunosWrapper() {
  const location = useLocation();
  const turmaSelecionada = location.state?.turmaSelecionada;
  const livroSelecionado = location.state?.livroSelecionado;

  if (!turmaSelecionada || !livroSelecionado) {
    return <div>Selecione uma turma e um livro no painel do professor.</div>;
  }

  return (
    <StudentsTab
      grade={turmaSelecionada.grade}
      turma={turmaSelecionada.turma}
      bookId={livroSelecionado.id}
    />
  );
}

function AlunoWrapper() {
  const location = useLocation();
  const aluno = location.state?.aluno;
  const grade = location.state?.grade;
  const turma = location.state?.turma;
  const bookId = location.state?.bookId;

  if (!aluno) {
    return <div>Aluno não encontrado.</div>;
  }

  // Importe e use aqui seu componente de detalhes do aluno, por exemplo:
  // return <StudentProfile aluno={aluno} grade={grade} turma={turma} bookId={bookId} />;
  return (

    <AlunoTab
      aluno={aluno}
      grade={grade}
      turma={turma}
      bookId={bookId}
    />
  );
}

// quizzes-desafios"
function TeacherQuizzesChallengesWrapper() {
  const location = useLocation();
  const turmaSelecionada = location.state?.turmaSelecionada;
  const livroSelecionado = location.state?.livroSelecionado;
  const email = location.state?.email;
  const grade = location.state?.grade;
  const turma = location.state?.turma;
  const bookId = location.state?.bookId;
  if (!turmaSelecionada ) {
    return <div>Selecione uma turma e um livro no painel do professor.</div>;
  }
  return (
    <TeacherQuizzesChallengesTab
      grade={turmaSelecionada.grade}
      turma={turmaSelecionada.turma}
      email={email}
    />
  );

}


function TeacherEscolhidosDashboardWrapper() {
  const location = useLocation();

  const email = location.state?.email;
  if (!email) {
    return <div>Selecione um email no painel do professor.</div>;
  }
  return (
    <TeacherEscolhidosDashboard
    email ={email}
    />
  );
}

function TeacherChallengesTabWrapper() {
  const location = useLocation();
  const turmaSelecionada = location.state?.turmaSelecionada;

  const email = location.state?.email;
  console.log("email", email);
  console.log("turmaSelecionada", turmaSelecionada);
  if (!turmaSelecionada ) {
    return <div>Selecione uma turma painel do professor.</div>;
  }
  return (
    <TeacherChallengesTab
      grade={turmaSelecionada.grade}
      turma={turmaSelecionada.turma}
      email={email}
    />
  );

}
function StudentDashboardWrapper() {
  const location = useLocation();
  const studentInfo = location.state?.studentInfo;
  if (!studentInfo) {
    return <div>Aluno não encontrado.</div>;
  }
  return (
    <StudentDashboard studentInfo={studentInfo} />
  );
}
function App() {
  const [appContext, setAppContext] = useState<microsoftTeams.app.Context>();
  const [appAppearance, setAppAppearance] = useState<themeNames>(themeNames.Default);
  const [userRole, setUserRole] = useState<"student" | "teacher">();
  const [isFirstAccess, setIsFirstAccess] = useState(false);
  const [email, setemail] = useState("");
  const [studentInfo, setStudentInfo] = useState<GetStudentInfoResponse | undefined>(undefined);
  const [userName, setUserName] = useState("");
  useEffect(() => {
    microsoftTeams.app.getContext().then(async (context) => {
      setAppContext(context);
      setAppAppearance(initTeamsTheme(context.app.theme));

     const userEmail = context.user?.userPrincipalName || "";
      console.log("context", context);
  //  const userEmail = "awsrtur@escolaglobal.org"
      console.log("User email:", userEmail);
      setemail(userEmail);

      // Verifica se é professor na base
      let data = await checkIfStudentExists(userEmail, true);

      let isTeacher = data;
      console.log("User is a teacher:", isTeacher);
      //      isTeacher = true;
      if (isTeacher) {
        console.log("User is a teacher:", isTeacher);
        setUserRole("teacher");
      } else {
        console.log("User is not a teacher:", !isTeacher);
        console.log("User email:", userEmail);
        const exists = await checkIfStudentExists(userEmail);
        if (!exists) {
          console.log("User is not a student:", exists);
          setIsFirstAccess(true);
        } else {
          const studentInfo = await getStudentInfo(userEmail);
          console.log("Student info:", studentInfo);
          setStudentInfo(studentInfo);
          setUserName(studentInfo.name);
          setUserRole("student");
          setIsFirstAccess(false);
        }
        console.log("User is a student:", exists);
      }


      microsoftTeams.app.notifySuccess();
    })  

    microsoftTeams.app.registerOnThemeChangeHandler((theme) => { 
      setAppAppearance(initTeamsTheme(theme));
    });
  }, []); 
  return (
    <FluentProvider theme={teamsLightTheme}>
      <Router>
        {isFirstAccess ? (
          <OnboardingStudent

          />
        ) : (
          <Routes>
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/termsofuse" element={<TermsOfUse />} />
            {!userRole ? (
              <Route
                path="/welcome"
                element={<WelcomeTab />}
              />
            ) : (
              <>
                <Route
                  path="/welcome"
                  element={userRole === "student" && studentInfo ? <StudentDashboard studentInfo={studentInfo}
                  /> : <TeacherDashboard email={email} />}
                />
                <Route path="/dashboard" element={<DashboardTab />} />
                {userRole === "teacher" && (
                  <>
                    <Route path="/teacher-dashboard" element={<TeacherDashboard email={email} />} />
                    {/* Rota para a aba "Meus Alunos" */}
                    <Route
                      path="/meus-alunos"
                      element={
                        <MeusAlunosWrapper />

                      }

                    />
                    <Route path="/aluno" element={<AlunoWrapper />} />
                    <Route
                      path="/teacher-escolhidos"
                      element={
                        <TeacherEscolhidosDashboardWrapper />
                      }
                    />
                    <Route
                      path="/quizzes-desafios"
                      element={
                        <TeacherQuizzesChallengesWrapper />
                      }
                    />
                    <Route
                      path="/teacher-challenges"
                      element={
                        <TeacherChallengesTabWrapper />
                      }
                    />
                    <Route
                    path='/student-dashboard'
                    element={
                      <StudentDashboardWrapper />
                    }
                    />
                  </>


                )}
                {userRole === "student" && (
                  <Route path="/student-dashboard" element={studentInfo ? <StudentDashboard studentInfo={studentInfo} /> : <div>Loading...</div>} />
                )}

                <Route path="/books" element={userRole === "student" ? <StudentBooks email={email} /> : <MyBooksTab userRole={userRole} />} />
                <Route path="Ranking" element={<StudentRanking email={email} />} />
                <Route path="/descobrir" element={<DiscoverTab userRole={userRole} studentInfo={studentInfo} />} />
                <Route


                  path="/desafios"
                  element={
                    <ChallengesTab
                      userRole={userRole}
                      email={studentInfo?.email || ""}
                      grade={studentInfo?.grade || ""}
                      turma={studentInfo?.turma || ""}
                    />
                  }
                />
                <Route path="/board" element={<BoardsTab />} />
                <Route path="/about" element={<About />} />
              </>
            )}
          </Routes>
        )}
      </Router>
    </FluentProvider>
  );
}

export default App;

function initTeamsTheme(theme: string | undefined): themeNames {
  switch (theme) {
    case "dark":
      return themeNames.Dark;
    case "contrast":
      return themeNames.HighContrast;
    default:
      return themeNames.Default;
  }
}
