import { IntegrationBase } from "@budibase/types"
import fetch from "node-fetch"

interface Query {
  method: string
  body?: string
  headers?: { [key: string]: string }
}

interface JsonDict {
  [key: string]: string | number | boolean | (string|number|boolean)[]
}

class CustomIntegration implements IntegrationBase {
  private readonly url: string
  private readonly pat: string
  private readonly github_user: string

  constructor(config: { repo_owner: string; pat: string; repo_name: string; user: string;}) {
    // https://api.github.com/repos/doingandlearning/budibase-issues/issues/1
    this.url = `https://api.github.com/repos/${config.repo_owner}/${config.repo_name}/issues`
    this.pat = config.pat
    this.github_user = config.user
  }

  async request(url: string, opts: Query) {
    if (!this.pat) {
      throw new Error("Need to provide a personal access token.")
    }
    
    const auth = { authorization: `Bearer ${this.pat}` }
    opts.headers = opts.headers ? { ...opts.headers, ...auth } : auth
    
    const response = await fetch(url, opts)
    if (response.status <= 300) {
      try {
        const contentType = response.headers.get("content-type")
        if (contentType?.includes("json")) {
          return await response.json()
        } else {
          return await response.text()
        }
      } catch (err) {
        return await response.text()
      }
    } else {
      const err = await response.text()
      throw new Error(err)
    }
  }

  async create(query: { title: string; body: string; }) {
    const body = {
      "title": query.title,
      "body": query.body,
      "assignees": [
        this.github_user
      ]
    }

    const opts = {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    }
    return this.request(this.url, opts)
  }

  async read(query: { id: string }) {
    const opts = {
      method: "GET",
    }
    if(query.id) {
      return this.request(`${this.url}/${query.id}`, opts)
    }
    return this.request(`${this.url}`, opts)
  }


  async update(query: { json: JsonDict }) {
    if(!query.json.id) {
      throw new Error("You need to provide an issue id")
    }
   const {id, ...body } = query.json
    const opts = {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    }
    return this.request(`${this.url}/${id}`, opts)
  }

  async delete(query: { id: string }) {
    const opts = {
      method: "PATCH",
      body: JSON.stringify({"state": "closed"})
    }
    return this.request(`${this.url}/${query.id}`, opts)
  }

  async close(query: { id: string }) {
    const opts = {
      method: "PATCH",
      body: JSON.stringify({"state": "closed"})
    }
    return this.request(`${this.url}/${query.id}`, opts)
  }
}

export default CustomIntegration
