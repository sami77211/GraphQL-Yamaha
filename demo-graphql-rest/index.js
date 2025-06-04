const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const axios = require('axios');
const qs = require('qs');
const cookieParser = require('cookie-parser');
require('dotenv').config();


const BASE_URL = process.env.BASE_URL;
const HOST = process.env.HOST;

// === 1. Schéma GraphQL ===
const typeDefs = gql`
  type User {
    uticode: String
    utinom: String
    utiprenom: String
    utiposition: String
    email: String
    grocode: String
  }

  type LoginResponse {
    success: Boolean
    message: String
    token: String
  }
  type Deal {
    clienttitlecode: String
    clientname: String
    clientfirstname: String
    firstassetmakelabel: String
    firstassetmodellabel: String
    firstassetcategorylabel: String
    dprnumero: String
    dosid: Int
    dpfdtlimite: Float
    dpimt: Float
    financedvalue: Float
    pfiinvestissement: Float
    actid: Int
    actnom: String
    actnom2: String
    actlibcourtclient: String
    actsiret: String
    actcode: String
    dprdtcreation: Float
    dprdtmodif: Float
    jalcode: String
    jallibelle: String
    phacode: String
    monthly: Float
    dpmlibelle: String
    # ... ajoute d'autres champs si besoin
  }
 type DashboardLayout {
    layout: [[String]]   # tableau de tableau de String, ou changer en JSON scalar si tu préfères
  }
type Dashboard {
  title: String
  id: String
}




type DashboardItem {
  type: String
  content: String
  layoutClass: String
  url: String
}

type ActorOption {
  code: String
  label: String
}

type DashboardCMS {
  editable: Boolean
  layout: [[DashboardItem]]
  actors: [ActorOption]
}
  type TableCell {
  value: String
  isheader: Boolean
}

type ChartOptions {
  classTable: String
  classNameCells: String
  classNameHeader: String
}

type ChartTable {
  type: String
  title: String
  options: ChartOptions
  data: [[TableCell]]
}
type DashboardWidget {
  type: String
  content: String
  layoutClass: String
  url: String
}

type Dashboardform {
  editable: Boolean
  layout: [[DashboardWidget]]
  actors: [ActorOption]
}


  type Query {
  
    allUsers: [User]
    foDeals: [Deal]
    foMyDeals: DashboardLayout
    foDashboards: [Dashboard]
    dashboardCMS: DashboardCMS
    kpiVLPayes7jours: ChartTable
    kpiVLJustifAEnvoyer: ChartTable
    kpiVLJustifNonConformes: ChartTable
     kpiVLEnAttentePaiement: ChartTable
     kpiProchainsPaiements: ChartTable
    wsMyCreditLinesDashboard: Dashboardform
    kpiEndFreePeriod: ChartTable
  }

  
  type Mutation {
    loginFO(username: String!, password: String!): LoginResponse
    loginBO(username: String!, password: String!): LoginResponse
  }
`;

// === 2. Résolveurs GraphQL ===
const resolvers = {
  Query: {


    allUsers: async (_, __, context) => {
      if (!context.foToken) {
        throw new Error("Accès refusé : veuillez d'abord vous connecter via FO.");
      }
    
      try {
        const res = await axios.get(`${BASE_URL}/fo/users`, {
          headers: { Cookie: context.foToken },
        });
        return res.data;
      } catch (error) {
      
        
        const status = error.response?.status;
        const data = error.response?.data;
        const message = error.message;
    
       
        console.error('Erreur allUsersFO:', { status, data, message });
    
       
        if (status === 401 || status === 403) {
          throw new Error('Non autorisé : votre session FO ou BO a peut-être expiré, veuillez vous reconnecter.');
        } else if (status >= 500) {
          throw new Error('Erreur serveur lors de la récupération des utilisateurs FO. Veuillez réessayer plus tard.');
        } else {
          throw new Error('Erreur inconnue lors de la récupération des utilisateurs FO.');
        }
      }
    },
    
    foDashboards: async (_, __, context) => {
      if (!context.foToken) {
        throw new Error("Accès refusé : veuillez d'abord vous connecter via FO.");
      }
    
      try {
        const res = await axios.get(`${BASE_URL}/fo/dashboards`, {
          headers: { Cookie: context.foToken }
        });
    
        
        if (!res.data || !res.data.dashboards) {
          throw new Error('Réponse invalide du serveur FO : dashboards manquants.');
        }
    
        return res.data.dashboards; 
    
      } catch (error) {
        const status = error.response?.status;
        const data = error.response?.data;
        const message = error.message;
    
        console.error('Erreur foDashboards:', { status, data, message });
    
        if (status === 401 || status === 403) {
          throw new Error('Non autorisé : votre session FO a peut-être expiré, veuillez vous reconnecter.');
        } else if (status >= 500) {
          throw new Error('Erreur serveur lors de la récupération des dashboards FO. Veuillez réessayer plus tard.');
        } else {
          throw new Error('Erreur inconnue lors de la récupération des dashboards FO.');
        }
      }
    },
    
    dashboardCMS: async (_, __, context) => {
      if (!context.foToken) {
        throw new Error("Accès refusé : veuillez d'abord vous connecter via FO.");
      }
    
      try {
        const res = await axios.get(`${BASE_URL}/fo/dashboards/CMS`, {
          headers: { Cookie: context.foToken },
        });
    
        const data = res.data;
    
        return {
          editable: data.Editable,
          layout: data.layout.map(row =>
            row.map(item => ({
              type: item.type || null,
              content: item.content || null,
              layoutClass: item.layoutClass || null,
              url: item.url || null,
            }))
          ),
          actors: data["View per Business Partner"]?.[0]?.options || [],
        };
      } catch (error) {
        const status = error.response?.status;
        const data = error.response?.data;
        const message = error.message;
        console.error('Erreur dashboardCMS:', { status, data, message });
    
        if (status === 401 || status === 403) {
          throw new Error('Non autorisé : votre session FO a peut-être expiré, veuillez vous reconnecter.');
        } else if (status >= 500) {
          throw new Error('Erreur serveur lors de la récupération du tableau de bord CMS. Veuillez réessayer plus tard.');
        } else {
          throw new Error('Erreur inconnue lors de la récupération du tableau de bord CMS.');
        }
      }
    },
    
    kpiVLPayes7jours: async (_, __, context) => {
      if (!context.foToken) {
        throw new Error("Accès refusé : veuillez d'abord vous connecter via FO.");
      }
    
      try {
        const res = await axios.get(`${BASE_URL}/fo/charts/KPIVLPayes7jours`, {
          headers: { Cookie: context.foToken },
        });
    
        const { type, title, options, data } = res.data;
    
        return {
          type,
          title,
          options: {
            classTable: options.classTable,
            classNameCells: options.classNameCells,
            classNameHeader: options.classNameHeader,
          },
          data: data.map(row =>
            row.map(cell => ({
              value: cell.value,
              isheader: cell.isheader ?? false,
            }))
          ),
        };
      } catch (error) {
        const status = error.response?.status;
        const data = error.response?.data;
        const message = error.message;
        console.error('Erreur kpiVLPayes7jours:', { status, data, message });
    
        if (status === 401 || status === 403) {
          throw new Error('Non autorisé : votre session FO a peut-être expiré, veuillez vous reconnecter.');
        } else if (status >= 500) {
          throw new Error('Erreur serveur lors de la récupération des données KPI payés 7 jours. Veuillez réessayer plus tard.');
        } else {
          throw new Error('Erreur inconnue lors de la récupération des données KPI payés 7 jours.');
        }
      }
    },
    
    kpiVLJustifAEnvoyer: async (_, __, context) => {
      if (!context.foToken) {
        throw new Error("Accès refusé : veuillez d'abord vous connecter via FO.");
      }
    
      try {
        const res = await axios.get(`${BASE_URL}/fo/charts/KPIVLJustifAEnvoyer`, {
          headers: { Cookie: context.foToken },
        });
    
        const { type, title, options, data } = res.data;
    
        return {
          type,
          title,
          options: {
            classTable: options.classTable,
            classNameCells: options.classNameCells,
            classNameHeader: options.classNameHeader,
          },
          data: data.map(row =>
            row.map(cell => ({
              value: cell.value,
              isheader: cell.isheader ?? false,
            }))
          ),
        };
      } catch (error) {
        const status = error.response?.status;
        const data = error.response?.data;
        const message = error.message;
        console.error('Erreur kpiVLJustifAEnvoyer:', { status, data, message });
    
        if (status === 401 || status === 403) {
          throw new Error('Non autorisé : votre session FO a peut-être expiré, veuillez vous reconnecter.');
        } else if (status >= 500) {
          throw new Error('Erreur serveur lors de la récupération des données KPI Justificatifs à envoyer. Veuillez réessayer plus tard.');
        } else {
          throw new Error('Erreur inconnue lors de la récupération des données KPI Justificatifs à envoyer.');
        }
      }
    },
    
    kpiVLJustifNonConformes: async (_, __, context) => {
      if (!context.foToken) {
        throw new Error("Accès refusé : veuillez d'abord vous connecter via FO.");
      }
    
      try {
        const res = await axios.get(`${BASE_URL}/fo/charts/KPIVLJustifNonConformes`, {
          headers: { Cookie: context.foToken },
        });
    
        const { type, title, options, data } = res.data;
    
        return {
          type,
          title,
          options: {
            classTable: options.classTable,
            classNameCells: options.classNameCells,
            classNameHeader: options.classNameHeader,
          },
          data: data.map(row =>
            row.map(cell => ({
              value: cell.value,
              isheader: cell.isheader ?? false,
            }))
          ),
        };
      } catch (error) {
        const status = error.response?.status;
        const data = error.response?.data;
        const message = error.message;
        console.error('Erreur kpiVLJustifNonConformes:', { status, data, message });
    
        if (status === 401 || status === 403) {
          throw new Error('Non autorisé : votre session FO a peut-être expiré, veuillez vous reconnecter.');
        } else if (status >= 500) {
          throw new Error('Erreur serveur lors de la récupération des données KPI Justificatifs non conformes. Veuillez réessayer plus tard.');
        } else {
          throw new Error('Erreur inconnue lors de la récupération des données KPI Justificatifs non conformes.');
        }
      }
    },
    
    kpiVLEnAttentePaiement: async (_, __, context) => {
      if (!context.foToken) {
        throw new Error("Accès refusé : veuillez d'abord vous connecter via FO.");
      }
    
      try {
        const res = await axios.get(`${BASE_URL}/fo/charts/KPIVLEnAttentePaiement`, {
          headers: { Cookie: context.foToken },
        });
    
        const { type, title, options, data } = res.data;
    
        return {
          type,
          title,
          options: {
            classTable: options.classTable,
            classNameCells: options.classNameCells,
            classNameHeader: options.classNameHeader,
          },
          data: data.map(row =>
            row.map(cell => ({
              value: cell.value,
              isheader: cell.isheader ?? false,
            }))
          ),
        };
      } catch (error) {
        const status = error.response?.status;
        const data = error.response?.data;
        const message = error.message;
        console.error('Erreur kpiVLEnAttentePaiement:', { status, data, message });
    
        if (status === 401 || status === 403) {
          throw new Error('Non autorisé : votre session FO a peut-être expiré, veuillez vous reconnecter.');
        } else if (status >= 500) {
          throw new Error('Erreur serveur lors de la récupération des données KPI En attente de paiement. Veuillez réessayer plus tard.');
        } else {
          throw new Error('Erreur inconnue lors de la récupération des données KPI En attente de paiement.');
        }
      }
    },
    
    kpiProchainsPaiements: async (_, __, context) => {
      if (!context.boToken) {
        throw new Error("Accès refusé : veuillez d'abord vous connecter via BO.");
      }
    
      try {
        const res = await axios.get(`${BASE_URL}/bo/charts/KPIPROCHAINSPAIEMENTS`, {
          headers: { Cookie: context.boToken },
        });
    
        const { type, title, options, data } = res.data;
    
        return {
          type,
          title,
          options: {
            classTable: options.classTable,
            classNameCells: options.classNameCells,
            classNameHeader: options.classNameHeader,
          },
          data: data.map(row =>
            row.map(cell => ({
              value: cell.value,
              isheader: cell.isheader ?? false,
            }))
          ),
        };
      } catch (error) {
        const status = error.response?.status;
        const data = error.response?.data;
        const message = error.message;
        console.error('Erreur kpiProchainsPaiements:', { status, data, message });
    
        if (status === 401 || status === 403) {
          throw new Error('Non autorisé : votre session BO a peut-être expiré, veuillez vous reconnecter.');
        } else if (status >= 500) {
          throw new Error('Erreur serveur lors de la récupération des données KPI Prochains paiements. Veuillez réessayer plus tard.');
        } else {
          throw new Error('Erreur inconnue lors de la récupération des données KPI Prochains paiements.');
        }
      }
    },
    
    wsMyCreditLinesDashboard: async (_, __, context) => {
      if (!context.boToken) {
        throw new Error("Accès refusé : veuillez d'abord vous connecter via BO.");
      }
    
      try {
        const res = await axios.get(`${BASE_URL}/bo/dashboards/wsmycreditlines`, {
          headers: { Cookie: context.boToken },
        });
    
        const layoutRaw = res.data.layout;
    
        const layout = layoutRaw.map(row =>
          row.map(item => ({
            type: null,
            content: null,
            layoutClass: item.layoutClass,
            url: item.url,
          }))
        );
    
        return {
          editable: false,
          layout,
          actors: [],
        };
      } catch (error) {
        const status = error.response?.status;
        const data = error.response?.data;
        const message = error.message;
        console.error('Erreur wsMyCreditLinesDashboard:', { status, data, message });
    
        if (status === 401 || status === 403) {
          throw new Error('Non autorisé : votre session BO a peut-être expiré, veuillez vous reconnecter.');
        } else if (status >= 500) {
          throw new Error('Erreur serveur lors de la récupération du dashboard wsmycreditlines. Veuillez réessayer plus tard.');
        } else {
          throw new Error('Erreur inconnue lors de la récupération du dashboard wsmycreditlines.');
        }
      }
    },
    
    kpiEndFreePeriod: async (_, __, context) => {
      if (!context.boToken) {
        throw new Error("Accès refusé : veuillez d'abord vous connecter via BO.");
      }
    
      try {
        const res = await axios.get(`${BASE_URL}/bo/charts/KPIENDFREEPERIOD`, {
          headers: { Cookie: context.boToken },
        });
    
        const { type, title, options, data } = res.data;
    
        return {
          type,
          title,
          options: {
            classTable: options.classTable,
            classNameCells: options.classNameCells,
            classNameHeader: options.classNameHeader,
          },
          data: data.map(row =>
            row.map(cell => ({
              value: cell.value,
              isheader: cell.isheader ?? false,
            }))
          ),
        };
      } catch (error) {
        const status = error.response?.status;
        const data = error.response?.data;
        const message = error.message;
        console.error('Erreur kpiEndFreePeriod:', { status, data, message });
    
        if (status === 401 || status === 403) {
          throw new Error('Non autorisé : votre session BO a peut-être expiré, veuillez vous reconnecter.');
        } else if (status >= 500) {
          throw new Error('Erreur serveur lors de la récupération des données KPI End Free Period. Veuillez réessayer plus tard.');
        } else {
          throw new Error('Erreur inconnue lors de la récupération des données KPI End Free Period.');
        }
      }
    },
    
    foDeals: async (_, __, context) => {
      if (!context.foToken) {
        throw new Error("Accès refusé : veuillez d'abord vous connecter via FO.");
      }
    
      try {
        const res = await axios.get(`${BASE_URL}/fo/deals`, {
          headers: { Cookie: context.foToken },
        });
        return res.data;
      } catch (error) {
        const status = error.response?.status;
        const data = error.response?.data;
        const message = error.message;
        console.error('Erreur foDeals:', { status, data, message });
    
        if (status === 401 || status === 403) {
          throw new Error('Non autorisé : votre session FO a peut-être expiré, veuillez vous reconnecter.');
        } else if (status >= 500) {
          throw new Error('Erreur serveur lors de la récupération des deals FO. Veuillez réessayer plus tard.');
        } else {
          throw new Error('Erreur inconnue lors de la récupération des deals FO.');
        }
      }
    }
    },
    

  Mutation: {
    loginFO: async (_, { username, password }, { res }) => {
      try {
        const data = qs.stringify({
          ksiopuser: username,
          ksiopvalue: password,
          ksiopremember: true,
        });

        const apiRes = await axios.post(`${BASE_URL}/fo/login`, data, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0',
            'Host': HOST,
          },
          withCredentials: true,
        });

        const setCookie = apiRes.headers['set-cookie'];
        if (setCookie && setCookie.length > 0) {
          
          const tokenMatch = setCookie.find(cookie => cookie.includes('unitoken='));
          if (tokenMatch) {
            const match = tokenMatch.match(/unitoken=([^;]+)/);
            if (match && match[1]) {
              const token = `unitoken=${match[1]}`;
              
              res.cookie('cookie-fo', token, { httpOnly: true, sameSite: 'lax' });
              return { success: true, message: 'Connexion FO réussie', token };
            }
          }
        }

        if (apiRes.data && apiRes.data.status === "Login success") {
          return { success: true, message: 'Connexion FO réussie (sans token)', token: null };
        }

        return { success: false, message: 'Token FO non trouvé', token: null };
      } catch (error) {
        console.error('Erreur loginFO:', error.response?.data || error.message);
        return { success: false, message: 'Échec de connexion FO', token: null };
      }
    },

    loginBO: async (_, { username, password }, { res }) => {
      try {
        const data = qs.stringify({
          ksiopuser: username,
          ksiopvalue: password,
          ksiopremember: true,
        });

        const apiRes = await axios.post(`${BASE_URL}/bo/login`, data, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0',
            'Host': HOST,
          },
          withCredentials: true,
        });

        const setCookie = apiRes.headers['set-cookie'];
        if (setCookie && setCookie.length > 0) {
          const tokenMatch = setCookie.find(cookie => cookie.includes('unitoken='));
          if (tokenMatch) {
            const match = tokenMatch.match(/unitoken=([^;]+)/);
            if (match && match[1]) {
              const token = `unitoken=${match[1]}`;
              res.cookie('cookie-bo', token, { httpOnly: true, sameSite: 'lax' });
              return { success: true, message: 'Connexion BO réussie', token };
            }
          }
        }

        if (apiRes.data && apiRes.data.status === "Login success") {
          return { success: true, message: 'Connexion BO réussie (sans token)', token: null };
        }

        return { success: false, message: 'Token BO non trouvé', token: null };
      } catch (error) {
        console.error('Erreur loginBO:', error.response?.data || error.message);
        return { success: false, message: 'Échec de connexion BO', token: null };
      }
    },
  },
};

// === 3. Démarrage du serveur Apollo + Express ===
async function startServer() {
  const app = express();
  app.use(cookieParser());

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req, res }) => {
    
      const foToken = req.cookies['cookie-fo'] || null;
      const boToken = req.cookies['cookie-bo'] || null;
      return { foToken, boToken, res };
    },
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql', cors: {
    origin: 'http://localhost:3000', 
    credentials: true,
  } });

  const PORT = 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Serveur GraphQL lancé : http://localhost:${PORT}/graphql`);
  });
}

startServer();
