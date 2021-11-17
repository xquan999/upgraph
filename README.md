查询语句

    {
        userpools(first:10){
            id
            user
            pid
            shares
            rewardDebt
        }
        
        poolEvents(first:10){
            id
            index
            value
            gasUsed
            gasPrice
            input
            
                user
                type
                pid
                amount
                
                timestamp
                number    
            }
    }
