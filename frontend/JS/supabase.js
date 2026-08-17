/**
 * ========================================================================
 * SUPABASE CLIENT - Cliente Supabase para uso no frontend
 * ========================================================================
 *
 * Este arquivo fornece funções utilitárias para usar o Supabase
 * como banco de dados alternativo ao MariaDB/MySQL.
 *
 * Para usar o Supabase:
 * 1. Crie um projeto no Supabase (https://supabase.com)
 * 2. Configure as variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY
 * 3. Importe este arquivo nos scripts que precisam acessar o Supabase
 *
 * NOTA: O backend principal continua usando Prisma + MariaDB/MySQL.
 * Este cliente é opcional para funcionalidades específicas do Supabase
 * como Storage (uploads), Auth (caso deseje migrar), ou Realtime.
 * ========================================================================
 */

var SUPABASE_URL = '';
var SUPABASE_ANON_KEY = '';

// Configuração via variáveis de ambiente (define no HTML ou via build)
if (typeof process !== 'undefined' && process.env) {
  SUPABASE_URL = process.env.SUPABASE_URL || '';
  SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
}

// Suporte a configuração via window (para uso direto no browser)
if (typeof window !== 'undefined') {
  SUPABASE_URL = window.SUPABASE_URL || SUPABASE_URL;
  SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
}

/**
 * Verifica se o Supabase está configurado
 */
function isSupabaseConfigured() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

/**
 * Faz uma requisição autenticada ao Supabase REST API
 * @param {string} table - Nome da tabela
 * @param {object} options - Opções da requisição
 * @returns {Promise<any>} - Dados da requisição
 */
async function supabaseQuery(table, options) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase não configurado. Defina SUPABASE_URL e SUPABASE_ANON_KEY.');
  }

  var url = SUPABASE_URL + '/rest/v1/' + table;
  var headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  var fetchOptions = {
    method: options.method || 'GET',
    headers: headers,
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  if (options.select) {
    url += '?select=' + encodeURIComponent(options.select);
  }

  if (options.filter) {
    var filterStr = Object.keys(options.filter)
      .map(function (k) { return k + '=eq.' + encodeURIComponent(options.filter[k]); })
      .join('&');
    url += (url.indexOf('?') !== -1 ? '&' : '?') + filterStr;
  }

  if (options.order) {
    url += (url.indexOf('?') !== -1 ? '&' : '?') + 'order=' + encodeURIComponent(options.order);
  }

  if (options.limit) {
    url += '&limit=' + options.limit;
  }

  var response = await fetch(url, fetchOptions);

  if (!response.ok) {
    var error = await response.json().catch(function () { return { message: 'Erro na requisição' }; });
    throw new Error(error.message || 'Erro ao acessar Supabase');
  }

  return response.json();
}

/**
 * Busca dados de uma tabela
 */
async function supabaseSelect(table, options) {
  return supabaseQuery(table, Object.assign({ method: 'GET' }, options));
}

/**
 * Insere dados em uma tabela
 */
async function supabaseInsert(table, data) {
  return supabaseQuery(table, { method: 'POST', body: data });
}

/**
 * Atualiza dados em uma tabela
 */
async function supabaseUpdate(table, data, filter) {
  return supabaseQuery(table, { method: 'PATCH', body: data, filter: filter });
}

/**
 * Deleta dados de uma tabela
 */
async function supabaseDelete(table, filter) {
  return supabaseQuery(table, { method: 'DELETE', filter: filter });
}

// Exporta funções para uso global
if (typeof window !== 'undefined') {
  window.SupabaseClient = {
    isConfigured: isSupabaseConfigured,
    select: supabaseSelect,
    insert: supabaseInsert,
    update: supabaseUpdate,
    delete: supabaseDelete,
  };
}
