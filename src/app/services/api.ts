//const API_URL = "https://teams-be.azurewebsites.net/api";
const API_URL = "http://localhost:7071/api";

export interface Book {
  title: string;
  pagesRead: number;
  completedOn?: string;
  timestamp?: string;
  pointsEarned: number;
}

export interface Student {
  id: string;
  name: string;
  booksRead: Book[];
}

export interface CheckStudentResponse {
  exists: boolean;
}
export interface GetStudentInfoResponse {
  id: string;
  email: string;
  name: string;
  grade: string;
  turma: string;
  booksRead: string[];
  points: number;
  currentlyReading: string[];
  createdAt: string;
  // Add other fields as needed
}
// Generic function to send POST requests
const isDev = true

const baseHeaders = {
  "Content-Type": "application/json",
  ...(isDev && { "ngrok-skip-browser-warning": "69420" }),
};

export async function postData(functionName: string, data: any) {
  const response = await fetch(`${API_URL}/${functionName}`, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify(data),
  });
  return response.json();
}

export async function getData(functionName: string, params: Record<string, string>) {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_URL}/${functionName}?${queryString}`, {
    headers: baseHeaders,
  });
  return response.json();
}
// Specific API calls
export function createClass(className: string, teacherId: string, teacherName: string) {
  return postData("createClass", { name: className, teacherId, teacherName });
}

export function addTeacher(classId: string, teacherId: string, teacherName: string) {
  return postData("addTeacher", { classId, teacherId, teacherName });
}

export function addStudent(classId: string, email: string) {
  return postData("addStudentToClass", { classId, email });
}

export function assignBook(classId: string, bookId: string, dueDate: string, points: number) {
  return postData("assignBookToClass", { classId, bookId, dueDate, points });
}

export function logReading(classId: string, email: string, bookId: string, status?: string, rating?: number, notes?: string) {
  return postData("logReading", { classId, email, bookId, status, rating, notes });
}

export function getClassData(classId: string) {
  return postData("getClassDashboard", { classId });
}

export function getLeaderboard(classId: string) {
  return getData("getLeaderboard", { classId });
}

export async function getStudentHistory(email: string) {
  const response = await getData("getStudentHistory", { email });
  return response.jsonBody || response;
}

export function addCurricularBook(bookData: any) {
  return postData("addCurricularBook", bookData);
}


export async function checkIfStudentExists(identifier: string, isTeacher = false): Promise<boolean> {
  try {
    const res = await fetch(
      `${API_URL}/checkUser?email=${identifier}&isTeacher=${isTeacher}`,
      {
        headers: {
          "Content-Type": "application/json",
          ...(isDev && { "ngrok-skip-browser-warning": "69420" }),
        },
      }
    );

    if (res.headers.get("Content-Type")?.includes("application/json")) {
      const data = await res.json();
      console.log("Response from checkIfStudentExists:", data);
      return data.exists;
    } else {
      console.error("Unexpected response format:", await res.text());
      return false;
    }
  } catch (err) {
    console.error("Erro ao verificar usuário:", err);
    return false;
  }
}

export async function getCurricularBooksByGrade(grade: string): Promise<any[]> {
  try {
    const res = await fetch(`${API_URL}/getCurricularBooksByGrade?ano=${grade}`);
    
    // Check if the response is OK
    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status} - ${res.statusText}`);
    }

    const data = await res.json();
    console.log("Data fetched from API:", data);

    // Ensure the result is a valid array of books
    if (Array.isArray(data.books)) {
      return data.books;
    } else {
      console.error("Unexpected response format:", data);
      return [];
    }
  } catch (err) {
    console.error("Erro ao buscar livros curriculares:", err);
    return [];
  }
}

export async function registerStudentAndBooks({  email, grade, books }: {
  email: string;
  grade: string;
  books: string[];
}): Promise<void> {
  try {
    await fetch(`${API_URL}/registerStudentAndBooks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, grade, books }),
    });
  } catch (err) {
    console.error("Erro ao registrar aluno:", err);
  }
}

/**
 * Logs the reading progress of a student.
 * @param email - The ID of the student.
 * @param bookId - The ID of the book.
 * @param currentPage - The current page number the student has read.
 * @param status - Optional status of the reading progress ("reading" or "finished").
 * @param notes - Optional notes about the reading progress.
 */
export async function registerReadingProgress(
  email: string,
  bookId: string,
  currentPage: number,
  status?: string,
  notes?: string
): Promise<void> {
  try {
    console.log("Registering reading progress:", {
      email,
      bookId,
      currentPage,
      status,
      notes,
    });
    const response = await fetch(`${API_URL}/registerReadingProgress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        bookId,
        currentPage,
        status,
        notes,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to register reading progress: ${response.statusText}`);
    }

    console.log("Reading progress registered successfully.");
  } catch (error) {
    console.error("Error registering reading progress:", error);
    throw error;
  }
}


/**
 * Fetches the books associated with a student.
 * @param email - The ID of the student.
 * @returns A promise resolving to the student's books categorized by status.
 */
export async function getStudentBooks(email: string): Promise<any[]> {
  try {
    

    const response = await fetch(`${API_URL}/getStudentsBooks?email=${email}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch student books: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching student books:", error);
    throw error;
  }
}

export async function getStudentInfo(email: string): Promise<GetStudentInfoResponse> {
  try {
    

    const response = await fetch(`${API_URL}/getStudentInfo?email=${email}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch student info: ${response.statusText}`);
    }
    return response.json();
  }
catch (error) {
  console.error("Error fetching student info:", error);
  throw error;
}
}
export async function getBookById(bookId: string): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/getBookById?bookId=${bookId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch book: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching book:", error);
    throw error;
  }
}
export async function getCurrentPageByBookId(email: string, bookId: string): Promise<number> {
  try {
    
    console.log("Fetching current page for student:", email, "and book:", bookId);
    const response = await fetch(`${API_URL}/getCurrentPageByBookId?email=${email}&bookId=${bookId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch current page: ${response.statusText}`);
    }
    const data = await response.json();
    // Supondo que o backend retorna { currentPage: 42 }
    return data.currentPage || 0;
  } catch (error) {
    console.error("Error fetching current page:", error);
    throw error;
  }
}
export async function getStudentRanking(email: string): Promise<any> {
  try {
    

    const response = await fetch(`${API_URL}/getStudentRanking?email=${email}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch student ranking: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching student ranking:", error);
    throw error;
  }
}
export async function getQuiz(bookId: string, capitulo: number) {
  try {
    const response = await fetch(`${API_URL}/getQuiz?bookId=${bookId}&capitulo=${capitulo}`);
   
    if (response.status === 404) {
      // Não existe quiz para esse capítulo, retorna vazio
      return { perguntas: [] };
    } if (!response.ok) {
      throw new Error(`Failed to fetch quiz: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching quiz:", error);
    throw error;
  }
}
export async function getAllQuizByBookId(bookId: string) {
  try {
    const response = await fetch(`${API_URL}/getAllQuizByBookId?bookId=${bookId}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch all quizzes: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching all quizzes:", error);
    throw error;
  }
}
export async function submitQuizAnswers({ email, bookId, capitulo, respostas }: {
  email: string;
  bookId: string;
  capitulo: number;
  respostas: string[];
}): Promise<any> { // <-- Altere para Promise<any>
  try {
    const response = await fetch(`${API_URL}/submitQuizAnswers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, bookId, capitulo, respostas }),
    });
    if (!response.ok) {
      throw new Error(`Failed to submit quiz answers: ${response.statusText}`);
    }
    return await response.json(); // <-- Retorne o JSON do backend
  } catch (error) {
    console.error("Error submitting quiz answers:", error);
    throw error;
  }
}

export async function getAnsweredQuizzes(email: string): Promise<any[]> {
  try {
    

    const response = await fetch(`${API_URL}/getAnsweredQuizzes?email=${email}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch answered quizzes: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching answered quizzes:", error);
    throw error;
  }
}

export async function addPointsToUser(email: string, tipo: string, points: number, detalhes?: string) {
  const response = await fetch(`${API_URL}/addPointsToUser`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, tipo, points, detalhes }),
  });
  if (!response.ok) throw new Error("Erro ao adicionar pontos");
  return response.json();
}

// Retorna total e histórico de pontos do usuário
export async function getPoints(email: string) {
  

  const response = await fetch(`${API_URL}/getPoints?email=${email}`);
  if (!response.ok) throw new Error("Erro ao buscar pontos");
  return response.json();
}

// Cria um novo desafio
export async function createDesafio(desafio: any) {
  const response = await fetch(`${API_URL}/createDesafio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(desafio),
  });
  if (!response.ok) throw new Error("Erro ao criar desafio");
  return response.json();
}

// Retorna desafios ativos da turma
export async function getDesafios(grade: string, turma: string) {
    const response = await fetch(`${API_URL}/getDesafiosTurma?grade=${encodeURIComponent(grade)}&turma=${encodeURIComponent(turma)}`);
    if (!response.ok) throw new Error("Erro ao buscar desafios");
    const data = await response.json();
    return data;
}

// Marca desafio como concluído e adiciona pontos
export async function completeDesafio(email: string, desafioId: string) {
  const response = await fetch(`${API_URL}/completeDesafio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, desafioId }),
  });
  if (!response.ok) throw new Error("Erro ao completar desafio");
  return response.json();
}

export async function getCompletedDesafios(email: string) {
  

  const response = await fetch(`${API_URL}/getCompletedDesafios?email=${email}`);
  if (!response.ok) throw new Error("Erro ao buscar desafios completos");
  return response.json();
}

export async function searchBooks(query: string) {
  const q = `subject:juvenile ${query}`;
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&langRestrict=pt&maxResults=10`
  );
  const data = await response.json();
  return (data.items || []).map((item: any) => ({
    title: item.volumeInfo.title,
    author: item.volumeInfo.authors?.[0] || "Autor desconhecido",
    description: item.volumeInfo.description || "",
    thumbnail: item.volumeInfo.imageLinks?.thumbnail,
  }));
}

export async function addBookToShelf(email: string, book: any) {
  console.log("Adicionando livro à estante:", book);
  const response = await fetch(`${API_URL}/addBookToShelf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, book }),
  });
  if (!response.ok) throw new Error("Erro ao adicionar livro à estante");
  return response.json();
}

export async function getPersonalBooks(email: string): Promise<any[]> {
  try {
    

    const response = await fetch(`${API_URL}/getPersonalBooks?email=${email}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch personal books: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching personal books:", error);
    throw error;
  }
}
export async function getCurricularBooks(grade: string): Promise<any[]> {
  try {

    
    const response = await fetch(`${API_URL}/getCurricularBooks?grade=${grade}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch curricular books: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching curricular books:", error);
    throw error;
  }
}
export async function searchBooksApi(query: string, grade: string

): Promise<any[]> {
  try {
    const response = await fetch(`${API_URL}/searchBooks?query=${encodeURIComponent(query)}&grade=${encodeURIComponent(grade)}`);
    if (!response.ok) {
      throw new Error(`Failed to search books: ${response.statusText}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error searching books:", error);
    throw error;
  }
}
export async function getStudentStatsToday(email: string) {
  const response = await fetch(`${API_URL}/getStudentStatsToday?email=${encodeURIComponent(email)}`);
  console.log("Response from getStudentStatsToday:", response);
  if (!response.ok) throw new Error("Erro ao buscar estatísticas do aluno");
  return response.json();
}

//import { getClasses, getClassStudents, getBooks, getStudentBookProgress } from "../services/api"; // <-- Adicione suas APIs reais aqui

// 1. Busca turmas do professor
export async function getClasses(email: string) {
  console.log("Fetching classes for email:", email);
  const response = await fetch(`${API_URL}/getClasses?email=${encodeURIComponent(email)}`);
  if (!response.ok) throw new Error("Erro ao buscar turmas");
  return response.json();
}

// 2. Busca alunos de uma turma (grade e turma)
export async function getClassStudents(grade: string, turma: string) {
  const response = await fetch(`${API_URL}/getClassStudents?grade=${encodeURIComponent(grade)}&turma=${encodeURIComponent(turma)}`);
  if (!response.ok) throw new Error("Erro ao buscar alunos da turma");
  return response.json();
}

// 3. Busca livros por ano (grade)
export async function getBooks(ano: string) {
  const response = await fetch(`${API_URL}/getBooks?ano=${encodeURIComponent(ano)}`);
  if (!response.ok) throw new Error("Erro ao buscar livros do ano");
  return response.json();
}

// 4. Progresso do aluno em um livro
export async function getStudentBookProgress(email: string, bookId: string) {
  const response = await fetch(`${API_URL}/getStudentBookProgress?email=${encodeURIComponent(email)}&bookId=${encodeURIComponent(bookId)}`);
  if (!response.ok) throw new Error("Erro ao buscar progresso do aluno no livro");
  return response.json();
}

// 5. Progresso de todos os alunos da turma em um livro
export async function getStudentBookProgressByClass(grade: string, turma: string, bookId: string) {
  const response = await fetch(`${API_URL}/getStudentBookProgressByClass?grade=${encodeURIComponent(grade)}&turma=${encodeURIComponent(turma)}&bookId=${encodeURIComponent(bookId)}`);
  if (!response.ok) throw new Error("Erro ao buscar progresso dos alunos no livro");
  return response.json();
}

// getStudentLogs
export async function getStudentLogs(email: string) {
  const response = await fetch(`${API_URL}/getStudentLogs?email=${encodeURIComponent(email)}`);
  if (!response.ok) throw new Error("Erro ao buscar logs do aluno");
  return response.json();
}
// getStudentQuizzes
export async function getStudentQuizzes(email: string) {
  const response = await fetch(`${API_URL}/getStudentQuizzes?email=${encodeURIComponent(email)}`);
  if (!response.ok) throw new Error("Erro ao buscar quizzes do aluno");
  return response.json();
}
export async function removeQuiz(quizId: string): Promise<void> {
  // Add the implementation for removing a quiz
}

export async function updateQuiz(quiz: {
  id: string;
  perguntas: any[];
  capitulo: number;
  livroId: string;
  bookId: string;
  ciclo: string;
  grade: string;
  leituraDedicada?: string;
  quizDeadline?: string;
}) {
  const response = await fetch(`${API_URL}/updateQuiz`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(quiz),
  });
  if (!response.ok) throw new Error("Erro ao atualizar quiz");
  return response.json();
}

export async function getBadgeInfo(id: string) {
  const response = await fetch(`${API_URL}/getBadgeInfo?id=${id}`);
  if (!response.ok) throw new Error("Erro ao buscar informações do badge");
  return response.json();
}
/**
 * Salva pontos de gamificação para o aluno.
 */
export async function addGamificationPoints(entry: {
  email: string;
  tipo: string;
  points: number;
  detalhes: string;
  earnedAt: string;
}) {
  const response = await fetch(`${API_URL}/addGamificationPoints`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!response.ok) throw new Error("Erro ao salvar pontos de gamificação");
  return response.json();
} 

export async function setEscolhidoBook(email: string, escolhido: any) {
  console.log("Definindo livro escolhido:", { email, escolhido });
  const response = await fetch(`${API_URL}/setEscolhidoBook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, escolhido }),
  });
  if (!response.ok) throw new Error("Erro ao definir livro escolhido");
  return response.json();
}

/**
 * Busca o livro escolhido do aluno do backend.
 */
export async function getEscolhidoBook(email: string) {
  const response = await fetch(`${API_URL}/getEscolhidoBook?email=${encodeURIComponent(email)}`);

  if (!response.ok) throw new Error("Erro ao buscar livro escolhido");
  return response.json();
}

/**
 * Retorna as perguntas abertas do quiz do livro escolhido para um dado terço.
 * As perguntas são as mesmas para qualquer livro.
 * @param terco number (1, 2, 3)
 */
export async function getEscolhidoQuizQuestion(terco: string, email: string): Promise<{perguntas: string[], quizId: string}> {
  const response = await fetch(`${API_URL}/getEscolhidoQuizQuestion?terco=${terco}&email=${encodeURIComponent(email)}`);
  if (!response.ok) throw new Error("Erro ao buscar perguntas do quiz do livro escolhido");
  return response.json();
}

/**
 * Salva as respostas do quiz do livro escolhido para o aluno.
 * @param params { email, fase, respostas, livroEscolhido }
 * @returns { success: boolean, doc: any }
 */
export async function setEscolhidoQuizAnswer(params: {
  email: string;
  fase: string; // "final", "terco-1", "terco-2"
  respostas: string[];
  livroEscolhido: { id: string; titulo: string; autor: string };
}): Promise<{ success: boolean; doc: any }> {
  const response = await fetch(`${API_URL}/setEscolhidoQuizAnswer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) throw new Error("Erro ao salvar respostas do quiz do livro escolhido");
  return response.json();
}
export async function getAlunosEscolhidos(grade: string, turma: string) {
  const response = await fetch(
    `${API_URL}/getAlunosEscolhidos?grade=${encodeURIComponent(grade)}&turma=${encodeURIComponent(turma)}`,
    { headers: baseHeaders }
  );
  if (!response.ok) throw new Error("Erro ao buscar alunos com livro escolhido");
  return response.json();
}


// MOCK: Atualiza avaliação do quiz (patch)
export async function patchQuizAnswer(quizId: string, data: Partial<{ nota: string; comentario: string; anulado: boolean }>) {
  // Simula um patch no backend
  const response = await fetch(`${API_URL}/patchQuizAnswer?id=${encodeURIComponent(quizId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Erro ao atualizar avaliação do quiz");
  return response.json();
}
// Busca as perguntas do quiz do professor para um terço específico de uma turma
export async function getTeacherQuiz({
  grade,
  turma,
  terco,
}: {
  grade: string;
  turma: string;
  terco: number;
}): Promise<{ perguntas: string[] }> {
  const response = await fetch(
    `${API_URL}/getTeacherQuiz?grade=${encodeURIComponent(grade)}&turma=${encodeURIComponent(turma)}&terco=${encodeURIComponent(terco)}`,
    { headers: baseHeaders }
  );
  if (!response.ok) throw new Error("Erro ao buscar quiz do professor");
  return response.json();
}

// Salva (cria ou atualiza) as perguntas do quiz do professor para um terço específico de uma turma
export async function setTeacherQuiz({
  grade,
  turma,
  terco,
  perguntas,
  professorEmail
}: {
  grade: string;
  turma: string;
  terco: string;
  perguntas: string[];
  professorEmail: string;
}): Promise<any> {
  console.log("setTeacherQuiz", { grade, turma, terco, perguntas, professorEmail });
  const response = await fetch(`${API_URL}/setTeacherQuiz`, {
    method: "POST",
    headers: baseHeaders,
    body: JSON.stringify({ grade, turma, terco, perguntas, professorEmail }),
  });
  if (!response.ok) throw new Error("Erro ao salvar quiz do professor");
  return response.json();
}

// Exclui o quiz do professor para um terço específico de uma turma
export async function deleteTeacherQuiz({
  grade,
  turma,
  terco,
}: {
  grade: string;
  turma: string;
  terco: number;
}): Promise<any> {
  const response = await fetch(
    `${API_URL}/deleteTeacherQuiz?grade=${encodeURIComponent(grade)}&turma=${encodeURIComponent(turma)}&terco=${encodeURIComponent(terco)}`,
    { method: "DELETE", headers: baseHeaders }
  );
  if (!response.ok) throw new Error("Erro ao excluir quiz do professor");
  return response.json();
}

// Busca um quiz do professor por ID
export async function getTeacherQuizById(quizId: string): Promise<any> {
  console.log("getTeacherQuizById", { quizId });
  const response = await fetch(
    `${API_URL}/getTeacherQuizById?id=${encodeURIComponent(quizId)}`,
    { headers: baseHeaders }
  );
  if (!response.ok) throw new Error("Erro ao buscar quiz por ID");
  return response.json();
}

export interface Desafio {
    id: string;
    titulo: string;
    descricao: string;
    tipo: "geral" | "livro-especifico";
    livroId?: string;
    grade: string;
    turma: string;
    dataInicio: string;
    dataFim: string;
    meta: {
        tipo: "paginas" | "livros" | "tempo";
        points: number;
    };
    badge: {
        id: string;
        nome: string;
    };
    criadoPor: string;
    earnedAt: string;
    status: "ativo" | "concluido" | "cancelado";
    progresso?: number;
}

export async function criarDesafio(desafio: Omit<Desafio, "id" | "earnedAt" | "status">) {
    const response = await fetch(`${API_URL}/criarDesafio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(desafio),
    });
    if (!response.ok) throw new Error("Erro ao criar desafio");
    return response.json();
}

export async function getDesafiosTurma(turma: string, grade: string) {
    const response = await fetch(`${API_URL}/getDesafiosTurma?turma=${encodeURIComponent(turma)}&grade=${encodeURIComponent(grade)}`);
    if (!response.ok) throw new Error("Erro ao buscar desafios da turma");
    return response.json();
}

export async function getDesafiosAluno(email: string) {
    const response = await fetch(`${API_URL}/getDesafiosAluno?email=${encodeURIComponent(email)}`);
    if (!response.ok) throw new Error("Erro ao buscar desafios do aluno");
    return response.json();
}

export async function atualizarProgressoDesafio(desafioId: string, email: string, progresso: number) {
    const response = await fetch(`${API_URL}/atualizarProgressoDesafio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ desafioId, email, progresso }),
    });
    if (!response.ok) throw new Error("Erro ao atualizar progresso do desafio");
    return response.json();
}

export async function removerDesafio(desafioId: string) {
    const response = await fetch(`${API_URL}/removerDesafio?id=${encodeURIComponent(desafioId)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
    });
    if (!response.ok) throw new Error("Erro ao remover desafio");
    return response.json();
}

export async function verificarConclusaoDesafio(
    email: string,
    progresso: number,
    tipo: string,
    bookId: string
): Promise<any> {
    const response = await fetch(`${API_URL}/verificarConclusaoDesafio?email=${encodeURIComponent(email)}&progresso=${progresso}&tipo=${tipo}&bookId=${bookId}`);
    
    if (!response.ok) {
        throw new Error('Erro ao verificar conclusão do desafio');
    }

    const data = await response.json();
    return data;
}

export async function submitEscolhidoQuizAnswers(email: string, bookId: string, terco: number, respostas: string[],quizId: string) {
  console.log("submitEscolhidoQuizAnswers", { email, bookId, terco, respostas });
  const response = await fetch(`${API_URL}/submitEscolhidoQuizAnswers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      bookId,
      terco,
      respostas,
      quizId
    }),
  });
  if (!response.ok) throw new Error('Failed to submit quiz answers');
  return response.json();
}

export async function getAnsweredEscolhidoQuizzes(email: string) {
  const response = await fetch(`${API_URL}/getAnsweredEscolhidoQuizzes?email=${encodeURIComponent(email)}`);
  if (response.status === 404) {
    return []; // Return empty array if no quizzes found
  }
  if (!response.ok) throw new Error('Failed to fetch answered quizzes');
  return response.json();
}

export async function removeBookFromShelf(email: string, bookId: string) {
  const response = await fetch(`${API_URL}/removeBookFromShelf`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, bookId }),
  });
  if (!response.ok) throw new Error("Erro ao remover livro da estante");
  return response.json();
}

export async function updateBookDetails(bookId: string, updates: { paginas?: number }) {
  const response = await fetch(`${API_URL}/updateBookDetails`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bookId, ...updates }),
  });
  if (!response.ok) throw new Error("Erro ao atualizar detalhes do livro");
  return response.json();
}

export interface PointsExplanation {
    totalPoints: number;
    pointsByType: {
        completion: number;
        quiz: number;
        firstProgress: number;
        streak: number;
        challenges: number;
    };
    lastPoints: {
        type: string;
        points: number;
        description: string;
        date: string;
        bookTitle?: string;
    }[];
}

export async function getPointsExplanation(email: string): Promise<PointsExplanation> {
    const response = await fetch(`${API_URL}/getPointsExplanation?email=${email}`);
    if (!response.ok) {
        throw new Error('Failed to fetch points explanation');
    }
    return response.json();
}

export async function submitSupport(email: string, name: string, message: string) {
  const response = await fetch(`${API_URL}/submitSupport`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      email, 
      name, 
      message,
      timestamp: new Date().toISOString()
    }),
  });
  if (!response.ok) throw new Error("Erro ao enviar mensagem de suporte");
  return response.json();
}

export async function registerStudentRequest(data: {
  name: string;
  year: string;
  classLetter: string;
  timestamp: string;
}) {
  const response = await fetch(`${API_URL}/registerStudentRequest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Erro ao enviar pedido de registo");
  return response.json();
}